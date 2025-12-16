import { Expose } from 'class-transformer';
import { IsArray, IsUUID } from 'class-validator';

export class CreateDmDto {
  @Expose({ name: 'user_ids' })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds!: string[];
}

