import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  ValidateNested,
  IsEmail,
  IsDate,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotificationType,
  NotificationPriority,
} from '../types/notification.types';

export class EmailAttachmentDto {
  @IsString()
  filename: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  path?: string;
}

export class EmailPayloadDto {
  @IsEmail({}, { each: true })
  to: string | string[];

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsEmail()
  from?: string;

  @IsOptional()
  @IsEmail({}, { each: true })
  cc?: string | string[];

  @IsOptional()
  @IsEmail({}, { each: true })
  bcc?: string | string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];
}

export class InAppNotificationPayloadDto {
  @IsString()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsUrl()
  actionUrl?: string;
}

export class SendNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmailPayloadDto)
  email?: EmailPayloadDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InAppNotificationPayloadDto)
  inApp?: InAppNotificationPayloadDto;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;
}
