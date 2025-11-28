import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class HeadersContextDto {
  @Expose({ name: 'x-user-id' })
  @IsUUID('4')
  userId!: string;

  @Expose({ name: 'x-org-id' })
  @IsUUID('4')
  orgId!: string;
}
