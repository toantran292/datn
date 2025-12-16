import { Expose } from 'class-transformer';

export class RoomResponseDto {
  @Expose() id: string;
  @Expose() orgId: string;
  @Expose() isPrivate: boolean;
  @Expose() name: string | null;
  @Expose() type: 'channel' | 'dm';
  @Expose() projectId: string | null; // null = org-level, string = project-specific
}
