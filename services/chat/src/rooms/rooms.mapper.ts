import { plainToInstance } from 'class-transformer';
import { RoomResponseDto, RoomMemberDto } from './dto/room.response.dto';
import { RoomEntity } from './repositories/room.repository';

interface RoomWithMembers extends RoomEntity {
  members?: Array<{
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    isOnline: boolean;
  }>;
}

export function toRoomResponseDto(row: RoomWithMembers) {
  const members = row.members?.map(m =>
    plainToInstance(RoomMemberDto, m, { excludeExtraneousValues: true })
  );

  return plainToInstance(
    RoomResponseDto,
    {
      id: row.id,
      orgId: row.orgId,
      isPrivate: row.isPrivate,
      name: row.name,
      type: row.type || 'channel', // Default to 'channel' for backward compatibility
      projectId: row.projectId || null,
      members,
    },
    { excludeExtraneousValues: true },
  );
}
