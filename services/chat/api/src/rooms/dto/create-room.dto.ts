import { IsBoolean } from 'class-validator';

export class CreateRoomDto {
  @IsBoolean()
  isPrivate!: boolean;
}
