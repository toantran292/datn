import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { types } from 'cassandra-driver';
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

  async createRoom(dto: CreateRoomDto, orgId: types.Uuid, userId: types.Uuid) {
    const roomType = dto.type || 'channel';
    const room = await this.roomsRepo.create(
      orgId,
      dto.isPrivate,
      dto.name,
      roomType
    );

    await this.roomMembersRepo.addMember(room.id, userId, orgId);

    this.chatsGateway.notifyRoomCreated(orgId.toString(), {
      id: room.id.toString(),
      name: room.name,
      isPrivate: room.isPrivate,
      orgId: room.orgId.toString(),
    });

    return room;
  }

  /**
   * Create a Direct Message room
   * - If DM with same members exists, return existing one
   * - DMs are always private
   * - DM name is generated from member names
   */
  async createDm(userIds: string[], orgId: types.Uuid, currentUserId: types.Uuid) {
    // Include current user in the member list
    const allUserIds = [...new Set([currentUserId.toString(), ...userIds])];

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
    const usersInfo = await this.identityService.getUsersFromOrg(orgId.toString(), allUserIds);

    // Generate DM name from member names (excluding current user for display)
    const otherUserNames = allUserIds
      .filter(id => id !== currentUserId.toString())
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

    // Add all members
    for (const userId of allUserIds) {
      await this.roomMembersRepo.addMember(room.id, types.Uuid.fromString(userId), orgId);
    }

    // Notify all members about the new DM
    for (const userId of allUserIds) {
      this.chatsGateway.notifyRoomJoined(orgId.toString(), {
        id: room.id.toString(),
        name: room.name,
        isPrivate: room.isPrivate,
        orgId: room.orgId.toString(),
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
    orgId: types.Uuid,
    userId: types.Uuid,
    projectId?: types.Uuid | null
  ) {
    const room = await this.roomsRepo.create(
      orgId,
      isPrivate,
      name,
      'channel',
      projectId
    );

    // Add creator as a member
    await this.roomMembersRepo.addMember(room.id, userId, orgId);

    // Notify creator that they joined the room (for WebSocket subscription)
    this.chatsGateway.notifyRoomJoined(orgId.toString(), {
      id: room.id.toString(),
      name: room.name,
      isPrivate: room.isPrivate,
      orgId: room.orgId.toString(),
      projectId: room.projectId?.toString() || null,
    }, userId.toString());

    // Also notify org about new room creation (for other users to see in browse)
    this.chatsGateway.notifyRoomCreated(orgId.toString(), {
      id: room.id.toString(),
      name: room.name,
      isPrivate: room.isPrivate,
      orgId: room.orgId.toString(),
      projectId: room.projectId?.toString() || null,
    });

    return room;
  }

  /**
   * Find existing DM with exact same members
   */
  private async findExistingDm(userIds: string[], orgId: types.Uuid): Promise<RoomEntity | null> {
    // Get all rooms for the first user
    const firstUserId = types.Uuid.fromString(userIds[0]);
    const { items: joinedRooms } = await this.listJoinedRooms(firstUserId, orgId, { limit: 1000 });

    // Filter DMs only
    const dms = joinedRooms.filter(room => room.type === 'dm');

    // Check each DM to see if it has the exact same members
    for (const dm of dms) {
      const { items: members } = await this.roomMembersRepo.findMembersByRoom(dm.id, { limit: 1000 });
      const dmMemberIds = new Set(members.map(m => m.userId.toString()));

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
   */
  async listJoinedRooms(
    userId: types.Uuid,
    orgId: types.Uuid,
    opts: { limit?: number; pagingState?: string } = {},
  ) {
    const pageSize = opts.limit ?? 50;

    // Get rooms where user is a member
    const memberIds = await this.roomMembersRepo.findRoomIdsByUserOrg(userId, orgId, { limit: 10_000 });
    const memberSet = new Set(memberIds.items.map(id => id.toString()));

    let cursor = opts.pagingState;
    const picked: RoomEntity[] = [];

    // Paginate through org rooms
    do {
      const { items, pagingState } = await this.roomsRepo.listByOrg(orgId, { limit: pageSize, pagingState: cursor });

      for (const room of items) {
        // Only include rooms where user is a member
        if (memberSet.has(room.id.toString())) {
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
   * Browse PUBLIC channels to join (like Slack's "Browse Channels")
   * - Only shows public rooms
   * - Does NOT include private rooms
   */
  async listPublicRooms(
    orgId: types.Uuid,
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
    userId: types.Uuid,
    orgId: types.Uuid,
    opts: { limit?: number; pagingState?: string } = {},
  ) {
    return this.listJoinedRooms(userId, orgId, opts);
  }

  async joinRoom(roomId: string, orgId: types.Uuid, userId: types.Uuid) {
    const roomTid = types.TimeUuid.fromString(roomId);
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomTid);
    if (!room) throw new NotFoundException('Room not found');
    const isMember = await this.roomMembersRepo.isMember(roomTid, userId);
    if (!isMember) {
      await this.roomMembersRepo.addMember(roomTid, userId, orgId);
      this.chatsGateway.notifyRoomJoined(orgId.toString(), {
        id: room.id.toString(),
        name: room.name,
        isPrivate: room.isPrivate,
        orgId: room.orgId.toString(),
      }, userId.toString());
    }
    return { joined: true };
  }

  async listRoomMembers(roomId: string, orgId: types.Uuid, userId: types.Uuid) {
    const roomTid = types.TimeUuid.fromString(roomId);

    // Verify room exists
    const room = await this.roomsRepo.findByOrgAndId(orgId, roomTid);
    if (!room) throw new NotFoundException('Room not found');

    // Verify user is a member (only members can see member list)
    const isMember = await this.roomMembersRepo.isMember(roomTid, userId);
    if (!isMember) throw new NotFoundException('You must be a member to view members');

    // Get all members
    const { items } = await this.roomMembersRepo.findMembersByRoom(roomTid, { limit: 1000 });

    // Get user IDs
    const userIds = items.map(m => m.userId.toString());

    // Fetch user info from Identity service
    const usersInfo = await this.identityService.getUsersFromOrg(orgId.toString(), userIds);

    // Get online status for all users
    const onlineStatus = this.presenceService.getOnlineStatus(userIds);

    // Combine all data
    return items.map(member => {
      const memberUserId = member.userId.toString();
      const userInfo = usersInfo.get(memberUserId);

      return {
        userId: memberUserId,
        orgId: member.orgId.toString(),
        lastSeenMessageId: member.lastSeenMessageId?.toString() ?? null,
        // User info from Identity
        email: userInfo?.email ?? null,
        displayName: userInfo?.display_name ?? `User ${memberUserId.slice(0, 8)}`,
        disabled: userInfo?.disabled ?? false,
        // Online status
        isOnline: onlineStatus.get(memberUserId) ?? false,
      };
    });
  }
}
