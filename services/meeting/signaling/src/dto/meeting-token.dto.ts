import { IsBoolean, IsOptional, IsString } from 'class-validator';
export class MeetingTokenDto {
    @IsString() room_id!: string;
    @IsString() user!: { id: string; name: string; email?: string };
    @IsOptional() @IsBoolean() isModerator?: boolean;
}
