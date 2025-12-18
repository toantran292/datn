import { IsString, IsOptional, IsBoolean, IsUUID, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LockWorkspaceDto {
  @ApiProperty({ description: 'Reason for locking the workspace' })
  @IsString()
  @MinLength(10, { message: 'Reason must be at least 10 characters' })
  reason: string;
}

export class UnlockWorkspaceDto {
  @ApiPropertyOptional({ description: 'Optional note when unlocking' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class RevokeOwnershipDto {
  @ApiProperty({ description: 'Reason for revoking ownership' })
  @IsString()
  @MinLength(10, { message: 'Reason must be at least 10 characters' })
  reason: string;

  @ApiPropertyOptional({ description: 'New owner user ID (optional)' })
  @IsUUID()
  @IsOptional()
  newOwnerId?: string;

  @ApiPropertyOptional({ description: 'Remove current owner from workspace entirely' })
  @IsBoolean()
  @IsOptional()
  removeCurrentOwner?: boolean;
}

export enum WorkspaceStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
}

export class ListWorkspacesQueryDto {
  @ApiPropertyOptional({ enum: WorkspaceStatus })
  @IsEnum(WorkspaceStatus)
  @IsOptional()
  status?: WorkspaceStatus;

  @ApiPropertyOptional({ description: 'Search by name or slug' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
