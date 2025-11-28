// src/chat/dto/create-room.dto.ts
import { Expose, Transform } from 'class-transformer';
import {IsBoolean, IsIn, IsOptional, IsString} from 'class-validator';

export class CreateRoomDto {
  @Expose({ name: 'is_private' })
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  })
  @IsBoolean()
  isPrivate!: boolean;

  @Expose()
  @IsString()
  @IsOptional()
  name?: string;

  @Expose()
  @IsString()
  @IsIn(['channel', 'dm'])
  @IsOptional()
  type?: 'channel' | 'dm';
}
