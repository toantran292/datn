import { Expose, Type } from 'class-transformer';

export class RoomMemberDto {
  @Expose() userId: string;
  @Expose() displayName: string;
  @Expose() avatarUrl: string | null;
  @Expose() isOnline: boolean;
}

export class RoomResponseDto {
  @Expose() id: string;
  @Expose() orgId: string;
  @Expose() isPrivate: boolean;
  @Expose() name: string | null;
  @Expose() type: 'channel' | 'dm';
  @Expose() projectId: string | null; // null = org-level, string = project-specific
  @Expose() createdBy: string | null; // User ID of creator
  @Expose() description: string | null; // Channel description

  @Expose()
  @Type(() => RoomMemberDto)
  members?: RoomMemberDto[]; // For DMs - list of other members
}
