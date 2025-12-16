import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomEntity, RoomsRepository } from './repositories/room.repository';
import { RoomMembersRepository } from './repositories/room-members.repository';
import { ChatsGateway } from '../chat/chat.gateway';
import { IdentityService } from '../common/identity/identity.service';
import { PresenceService } from '../common/presence/presence.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly roomsRepo: RoomsRepository,
    private readonly roomMembersRepo: RoomMembersRepository,
    @Inject(forwardRef(() => ChatsGateway))
    private readonly chatsGateway: ChatsGateway,
    private readonly identityService: IdentityService,
    private readonly presenceService: PresenceService,
  ) { }

  async createRoom(dto: CreateRoomDto, orgId: string, userId: string) {
    const roomType = dto.type || 'channel';
    const room = await this.roomsRepo.create(
      orgId,
      dto.isPrivate,
      dto.name,
      roomType
    );

    await this.roomMembersRepo.addMember(room.id, userId, orgId, {
      roomType: room.type,
      roomName: room.name,
      isPrivate: room.isPrivate,
      projectId: room.projectId,
    });

    this.chatsGateway.notifyRoomCreated(orgId, {
      id: room.id,
      name: room.name,
      isPrivate: room.isPrivate,
      orgId: room.orgId,
    });

    return room;
  }

  /**
   * Create a Direct Message room
   * - If DM with same members exists, return existing one
   * - DMs are always private
   * - DM name is generated from member names
   */
  async createDm(userIds: string[], orgId: string, currentUserId: string) {
    // Include current user in the member list
    const allUserIds = [...new Set([currentUserId, ...userIds])];

    // Validate: need at least 2 users for a DM
    if (allUserIds.length < 2) {
      throw new Error('DM requires at least 2 users');
    }

    // Check if DM already exists with these exact members
    const existingDm = await this.findExistingDm(allUserIds, orgId);
    if (existingDm) {
      return existingDm;
    }

    // Fetch user info to generate DM name
    const usersInfo = await this.identityService.getUsersFromOrg(orgId, allUserIds);

    // Generate DM name from member names (excluding current user for display)
    const otherUserNames = allUserIds
      .filter(id => id !== currentUserId)
      .map(id => {
        const userInfo = usersInfo.get(id);
        return userInfo?.display_name || userInfo?.email?.split('@')[0] || `User ${id.slice(0, 8)}`;
      });

    const dmName = otherUserNames.join(', ') || 'Direct Message';

    // Create new DM room
    const room = await this.roomsRepo.create(
      orgId,
      true, // DMs are always private
      dmName, // Use generated name
      'dm'
    );

    // Add all members with room data for denormalized tables
    for (const userId of allUserIds) {
      await this.roomMembersRepo.addMember(room.id, userId, orgId, {
        roomType: 'dm',
        roomName: room.name,
        isPrivate: true,
        projectId: null,
      });
    }

    // Notify all members about the new DM
    for (const userId of allUserIds) {
      this.chatsGateway.notifyRoomJoined(orgId, {
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate,
        orgId: room.orgId,
      }, userId);
    }

    return room;
  }

  /**
   * Create a Channel (public or private)
   * - Creator is automatically added as a member
   * - Creator is notified via room:member_joined event
   * - Can be org-level (projectId = null) or project-specific (projectId = uuid)
   */
  async createChannel(
    name: string,
    isPrivate: boolean,
    orgId: string,
    userId: string,
    projectId?: string | null
  ) {
    const room = await this.roomsRepo.create(
      orgId,
      isPrivate,
      name,
      'channel',
      projectId
    );

    // Add creator as a member with room data for denormalized tables
    await this.roomMembersRepo.addMember(room.id, userId, orgId, {
      roomType: 'channel',
      roomName: room.name,
      isPrivate: room.isPrivate,
      projectId: projectId,
    });

    // Notify creator that they joined the room (for WebSocket subscription)
    this.chatsGateway.notifyRoomJoined(orgId, {
      id: room.id,
      name: room.name,
      isPrivate: room.isPrivate,
      orgId: room.orgId,
      projectId: room.projectId || null,
    }, userId);

    // Also notify org about new room creation (for other users to see in browse)
    this.chatsGateway.notifyRoomCreated(orgId, {
      id: room.id,
      name: room.name,
      isPrivate: room.isPrivate,
      orgId: room.orgId,
      projectId: room.projectId || null,
    });

    return room;
  }

  /**
   * Find existing DM with exact same members
   */
  private async findExistingDm(userIds: string[], orgId: string): Promise<RoomEntity | null> {
    // Get all rooms for the first user
    const firstUserId = userIds[0];
    const { items: joinedRooms } = await this.listJoinedRooms(firstUserId, orgId, { limit: 1000 });

    // Filter DMs only
    const dms = joinedRooms.filter(room => room.type === 'dm');

    // Check each DM to see if it has the exact same members
    for (const dm of dms) {
      const { items: members } = await this.roomMembersRepo.findMembersByRoom(dm.id, { limit: 1000 });
      const dmMemberIds = new Set(members.map(m => m.userId));

      // Check if member sets are identical
      if (dmMemberIds.size === userIds.length && userIds.every(id => dmMemberIds.has(id))) {
        return dm;
      }
    }

    return null;
  }

  /**
   * List rooms that user has JOINED
   * - Shows in sidebar
   * - User receives notifications
   * - Uses optimized denormalized table for fast lookup
   */
  async listJoinedRooms(
    userId: string,
    orgId: string,
    opts: { limit?: number; pagingState?: string; projectId?: string } = {},
  ) {
    // If projectId is specified, use project-specific query
    if (opts.projectId) {
      const result = await this.roomsRepo.listJoinedRoomsByUserAndProject(userId, orgId, opts.projectId, {
        limit: opts.limit,
        pagingState: opts.pagingState,
      });

      // Convert UserRoomEntity to RoomEntity format
      return {
        items: result.items.map(ur => ({
          id: ur.roomId,
          orgId: ur.orgId,
          isPrivate: ur.isPrivate,
          name: ur.roomName,
          type: ur.roomType,
          projectId: ur.projectId,
        })),
        pagingState: result.pagingState ?? null,
      };
    }

    // Otherwise use general user_rooms query and filter for org-level only
    const result = await this.roomsRepo.listJoinedRoomsByUser(userId, orgId, {
      limit: opts.limit ? opts.limit * 2 : 100, // Fetch more to account for filtering
      pagingState: opts.pagingState,
    });

    // Filter to only org-level rooms (projectId = null) and DMs
    const orgLevelRooms = result.items.filter(ur => ur.projectId === null || ur.projectId === undefined);

    // Convert UserRoomEntity to RoomEntity format
    return {
      items: orgLevelRooms.slice(0, opts.limit ?? 50).map(ur => ({
        id: ur.roomId,
        orgId: ur.orgId,
        isPrivate: ur.isPrivate,
        name: ur.roomName,
        type: ur.roomType,
        projectId: ur.projectId,
      })),
      pagingState: result.pagingState ?? null,
    };
  }

  /**
   * List DMs for a user in an org
   * - Uses optimized user_dms table
   */
  async listDms(
    userId: string,
    orgId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ) {
    const result = await this.roomsRepo.listDmsByUser(userId, orgId, {
      limit: opts.limit,
      pagingState: opts.pagingState,
    });

    // Convert UserRoomEntity to RoomEntity format
    return {
      items: result.items.map(ur => ({
        id: ur.roomId,
        orgId: ur.orgId,
        isPrivate: true,
        name: ur.roomName,
        type: 'dm' as const,
        projectId: null,
      })),
      pagingState: result.pagingState ?? null,
    };
  }

  /**
   * List org-level channels (channels without projectId)
   * - Uses user_rooms table and filters for projectId = null
   */
  async listOrgChannels(
    userId: string,
    orgId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ) {
    const result = await this.roomsRepo.listJoinedRoomsByUser(userId, orgId, {
      limit: opts.limit ? opts.limit * 2 : 100, // Fetch more to account for filtering
      pagingState: opts.pagingState,
    });

    // Filter to only org-level channels (projectId = null AND type = 'channel')
    const orgChannels = result.items.filter(ur =>
      ur.roomType === 'channel' && (ur.projectId === null || ur.projectId === undefined)
    );

    return {
      items: orgChannels.slice(0, opts.limit ?? 50).map(ur => ({
        id: ur.roomId,
        orgId: ur.orgId,
        isPrivate: ur.isPrivate,
        name: ur.roomName,
        type: ur.roomType,
        projectId: null,
      })),
      pagingState: result.pagingState ?? null,
    };
  }

  /**
   * List project-specific channels
   * - Uses user_project_rooms table for fast lookup
   */
  async listProjectChannels(
    userId: string,
    orgId: string,
    projectId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ) {
    const result = await this.roomsRepo.listJoinedRoomsByUserAndProject(userId, orgId, projectId, {
      limit: opts.limit,
      pagingState: opts.pagingState,
    });

    return {
      items: result.items.map(ur => ({
        id: ur.roomId,
        orgId: ur.orgId,
        isPrivate: ur.isPrivate,
        name: ur.roomName,
        type: ur.roomType,
        projectId: ur.projectId,
      })),
      pagingState: result.pagingState ?? null,
    };
  }

  /**
   * Browse PUBLIC org-level channels (channels not in any project)
   */
  async browseOrgPublicRooms(
    orgId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ) {
    const pageSize = opts.limit ?? 100;

    let cursor = opts.pagingState;
    const picked: RoomEntity[] = [];

    // Paginate through org rooms
    do {
      const { items, pagingState } = await this.roomsRepo.listByOrg(orgId, { limit: pageSize, pagingState: cursor });

      for (const room of items) {
        // Only include PUBLIC org-level channels (not in any project)
        if (!room.isPrivate && room.type === 'channel' && !room.projectId) {
          picked.push(room);
        }

        if (picked.length >= pageSize) break;
      }

      if (picked.length >= pageSize || !pagingState) {
        cursor = pagingState ?? undefined;
        break;
      }
      cursor = pagingState;
    } while (true);

    return { items: picked, pagingState: cursor ?? null };
  }

  /**
   * Browse PUBLIC project-specific channels
   */
  async browseProjectPublicRooms(
    orgId: string,
    projectId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ) {
    const pageSize = opts.limit ?? 100;

    let cursor = opts.pagingState;
    const picked: RoomEntity[] = [];

    // Paginate through org rooms
    do {
      const { items, pagingState } = await this.roomsRepo.listByOrg(orgId, { limit: pageSize, pagingState: cursor });

      for (const room of items) {
        // Only include PUBLIC channels in the specified project
        if (!room.isPrivate && room.type === 'channel' && room.projectId === projectId) {
          picked.push(room);
        }

        if (picked.length >= pageSize) break;
      }

      if (picked.length >= pageSize || !pagingState) {
        cursor = pagingState ?? undefined;
        break;
      }
      cursor = pagingState;
    } while (true);

    return { items: picked, pagingState: cursor ?? null };
  }

  /**
   * DEPRECATED: Use browseOrgPublicRooms or browseProjectPublicRooms instead
   * Browse PUBLIC channels to join (like Slack's "Browse Channels")
   * - Only shows public rooms
   * - Does NOT include private rooms
   */
  async listPublicRooms(
    orgId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ) {
    const pageSize = opts.limit ?? 100;

    let cursor = opts.pagingState;
    const picked: RoomEntity[] = [];

    // Paginate through org rooms
    do {
      const { items, pagingState } = await this.roomsRepo.listByOrg(orgId, { limit: pageSize, pagingState: cursor });

      for (const room of items) {
        // Only include PUBLIC rooms
        if (!room.isPrivate) {
          picked.push(room);
        }

        if (picked.length >= pageSize) break;
      }

      if (picked.length >= pageSize || !pagingState) {
        cursor = pagingState ?? undefined;
        break;
      }
      cursor = pagingState;
    } while (true);

    return { items: picked, pagingState: cursor ?? null };
  }

  /**
   * Legacy method - kept for backward compatibility
   * @deprecated Use listJoinedRooms instead
   */
  async listRoomsForUser(
    userId: string,
    orgId: string,
    opts: { limit?: number; pagingState?: string } = {},
  ) {
    return this.listJoinedRooms(userId, orgId, opts);
  }

  async joinRoom(roomId: string, orgId: string, userId: string) {
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomId);
    if (!room) throw new NotFoundException('Room not found');
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) {
      await this.roomMembersRepo.addMember(roomId, userId, orgId, {
        roomType: room.type,
        roomName: room.name,
        isPrivate: room.isPrivate,
        projectId: room.projectId,
      });
      this.chatsGateway.notifyRoomJoined(orgId, {
        id: room.id,
        name: room.name,
        isPrivate: room.isPrivate,
        orgId: room.orgId,
      }, userId);
    }
    return { joined: true };
  }

  async listRoomMembers(roomId: string, orgId: string, userId: string) {
    // Verify room exists
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomId);
    if (!room) throw new NotFoundException('Room not found');

    // Verify user is a member (only members can see member list)
    const isMember = await this.roomMembersRepo.isMember(roomId, userId);
    if (!isMember) throw new NotFoundException('You must be a member to view members');

    // Get all members
    const { items } = await this.roomMembersRepo.findMembersByRoom(roomId, { limit: 1000 });

    // Get user IDs
    const userIds = items.map(m => m.userId);

    // Fetch user info from Identity service
    const usersInfo = await this.identityService.getUsersFromOrg(orgId, userIds);

    // Get online status for all users
    const onlineStatus = this.presenceService.getOnlineStatus(userIds);

    // Combine all data
    return items.map(member => {
      const memberUserId = member.userId;
      const userInfo = usersInfo.get(memberUserId);

      return {
        userId: memberUserId,
        orgId: member.orgId,
        role: member.role,
        lastSeenMessageId: member.lastSeenMessageId ?? null,
        // User info from Identity
        email: userInfo?.email ?? null,
        displayName: userInfo?.display_name ?? `User ${memberUserId.slice(0, 8)}`,
        disabled: userInfo?.disabled ?? false,
        // Online status
        isOnline: onlineStatus.get(memberUserId) ?? false,
      };
    });
  }

  // ============== UC01: Room Management ==============

  /**
   * UC01: Update room info (name, description, isPrivate)
   * - Only ADMIN can update
   */
  async updateRoom(
    roomId: string,
    orgId: string,
    userId: string,
    data: { name?: string; description?: string; isPrivate?: boolean }
  ) {
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomId);
    if (!room) throw new NotFoundException('Room not found');

    // Check if user is admin
    const member = await this.roomMembersRepo.get(roomId, userId);
    if (!member) throw new ForbiddenException('You are not a member of this room');
    if (member.role !== 'ADMIN') throw new ForbiddenException('Only admins can update room');

    await this.roomsRepo.update(roomId, data);

    // Notify room updated
    this.chatsGateway.notifyRoomUpdated(orgId, {
      id: roomId,
      ...data,
    });

    return { updated: true };
  }

  /**
   * UC01: Archive room
   * - Only ADMIN can archive
   */
  async archiveRoom(roomId: string, orgId: string, userId: string) {
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomId);
    if (!room) throw new NotFoundException('Room not found');

    const member = await this.roomMembersRepo.get(roomId, userId);
    if (!member) throw new ForbiddenException('You are not a member of this room');
    if (member.role !== 'ADMIN') throw new ForbiddenException('Only admins can archive room');

    await this.roomsRepo.archive(roomId);

    this.chatsGateway.notifyRoomArchived(orgId, roomId);

    return { archived: true };
  }

  /**
   * UC01: Delete room (soft delete)
   * - Only ADMIN can delete
   */
  async deleteRoom(roomId: string, orgId: string, userId: string) {
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomId);
    if (!room) throw new NotFoundException('Room not found');

    const member = await this.roomMembersRepo.get(roomId, userId);
    if (!member) throw new ForbiddenException('You are not a member of this room');
    if (member.role !== 'ADMIN') throw new ForbiddenException('Only admins can delete room');

    await this.roomsRepo.softDelete(roomId);

    this.chatsGateway.notifyRoomDeleted(orgId, roomId);

    return { deleted: true };
  }

  // ============== UC02: Member Management ==============

  /**
   * UC02: Invite member to room
   * - Only ADMIN can invite to private rooms
   * - Anyone can invite to public rooms (or set to admin only)
   */
  async inviteMember(roomId: string, orgId: string, inviterId: string, targetUserId: string) {
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomId);
    if (!room) throw new NotFoundException('Room not found');

    // Check if inviter is member
    const inviterMember = await this.roomMembersRepo.get(roomId, inviterId);
    if (!inviterMember) throw new ForbiddenException('You are not a member of this room');

    // For private rooms, only admin can invite
    if (room.isPrivate && inviterMember.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can invite to private rooms');
    }

    // Check if target is already a member
    const existingMember = await this.roomMembersRepo.isMember(roomId, targetUserId);
    if (existingMember) throw new BadRequestException('User is already a member');

    // Add member
    await this.roomMembersRepo.addMember(roomId, targetUserId, orgId, {
      roomType: room.type,
      roomName: room.name,
      isPrivate: room.isPrivate,
      projectId: room.projectId,
    });

    // Notify
    this.chatsGateway.notifyRoomJoined(orgId, {
      id: room.id,
      name: room.name,
      isPrivate: room.isPrivate,
      orgId: room.orgId,
      projectId: room.projectId,
    }, targetUserId);

    return { invited: true };
  }

  /**
   * UC02: Remove member from room
   * - Admin can remove anyone (except last admin)
   * - Users can remove themselves (leave)
   */
  async removeMember(roomId: string, orgId: string, requesterId: string, targetUserId: string) {
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomId);
    if (!room) throw new NotFoundException('Room not found');

    const requesterMember = await this.roomMembersRepo.get(roomId, requesterId);
    if (!requesterMember) throw new ForbiddenException('You are not a member of this room');

    // Self removal (leave) is always allowed
    const isSelfRemoval = requesterId === targetUserId;

    if (!isSelfRemoval) {
      // Only admin can remove others
      if (requesterMember.role !== 'ADMIN') {
        throw new ForbiddenException('Only admins can remove members');
      }
    }

    // Check target is member
    const targetMember = await this.roomMembersRepo.get(roomId, targetUserId);
    if (!targetMember) throw new NotFoundException('Target user is not a member');

    // Prevent removing the last admin
    if (targetMember.role === 'ADMIN') {
      const adminCount = await this.roomMembersRepo.countAdmins(roomId);
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin. Transfer ownership first.');
      }
    }

    await this.roomMembersRepo.removeMember(roomId, targetUserId);

    this.chatsGateway.notifyMemberRemoved(orgId, roomId, targetUserId);

    return { removed: true };
  }

  /**
   * UC02: Update member role
   * - Only ADMIN can change roles
   * - Cannot demote the last admin
   */
  async updateMemberRole(
    roomId: string,
    orgId: string,
    requesterId: string,
    targetUserId: string,
    newRole: 'ADMIN' | 'MEMBER'
  ) {
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomId);
    if (!room) throw new NotFoundException('Room not found');

    const requesterMember = await this.roomMembersRepo.get(roomId, requesterId);
    if (!requesterMember) throw new ForbiddenException('You are not a member of this room');
    if (requesterMember.role !== 'ADMIN') throw new ForbiddenException('Only admins can change roles');

    const targetMember = await this.roomMembersRepo.get(roomId, targetUserId);
    if (!targetMember) throw new NotFoundException('Target user is not a member');

    // Prevent demoting the last admin
    if (targetMember.role === 'ADMIN' && newRole === 'MEMBER') {
      const adminCount = await this.roomMembersRepo.countAdmins(roomId);
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last admin');
      }
    }

    await this.roomMembersRepo.updateRole(roomId, targetUserId, newRole);

    this.chatsGateway.notifyMemberRoleChanged(orgId, roomId, targetUserId, newRole);

    return { updated: true, role: newRole };
  }

  // ============== UC04: Leave Room ==============

  /**
   * UC04: Leave room
   * - User removes themselves from room
   * - Cannot leave if you're the last admin
   */
  async leaveRoom(roomId: string, orgId: string, userId: string) {
    return this.removeMember(roomId, orgId, userId, userId);
  }
}
