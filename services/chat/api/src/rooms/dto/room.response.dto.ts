import { Expose } from 'class-transformer';

export class RoomResponseDto {
  @Expose() id: string;
  @Expose() orgId: string;
  @Expose() isPrivate: boolean;
}
