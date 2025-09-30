import { IsString, IsOptional } from 'class-validator';
export class CreateRoomDto {
    @IsString() hostUserId!: string;
    @IsOptional() @IsString() chatThreadId?: string;
}
