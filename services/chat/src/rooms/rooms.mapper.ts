import { plainToInstance } from 'class-transformer';
import { RoomResponseDto } from './dto/room.response.dto';
import { RoomEntity } from './repositories/room.repository';

export function toRoomResponseDto(row: RoomEntity) {
  return plainToInstance(
    RoomResponseDto,
    {
      id: row.id?.toString(),
      orgId: row.orgId?.toString(),
      isPrivate: row.isPrivate,
      name: row.name,
      type: row.type || 'channel', // Default to 'channel' for backward compatibility
    },
    { excludeExtraneousValues: true },
  );
}
