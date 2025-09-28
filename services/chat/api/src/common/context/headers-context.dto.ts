import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class HeadersContextDto {
  @Expose({ name: 'x-user-id' })
  @IsUUID()
  userId!: string;

  @Expose({ name: 'x-org-id' })
  @IsUUID()
  orgId!: string;
}
