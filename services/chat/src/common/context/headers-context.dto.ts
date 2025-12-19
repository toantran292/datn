import { Expose } from 'class-transformer';
import { Matches } from 'class-validator';

// UUID-like pattern (accepts any 8-4-4-4-12 hex format)
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class HeadersContextDto {
  @Expose({ name: 'x-user-id' })
  @Matches(UUID_PATTERN, { message: 'userId must be a valid UUID format' })
  userId!: string;

  @Expose({ name: 'x-org-id' })
  @Matches(UUID_PATTERN, { message: 'orgId must be a valid UUID format' })
  orgId!: string;
}
