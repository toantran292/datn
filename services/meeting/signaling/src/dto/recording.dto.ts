import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

/**
 * DTO for starting a recording
 */
export class StartRecordingDto {
  @IsString()
  meeting_id: string;

  @IsString()
  user_id: string;

  @IsOptional()
  @IsString()
  session_id?: string;
}

/**
 * DTO for stopping a recording
 */
export class StopRecordingDto {
  @IsString()
  user_id: string;
}

/**
 * DTO for Jibri webhook callback
 */
export class JibriWebhookDto {
  @IsString()
  session_id: string;

  @IsIn(['started', 'stopped', 'failed'])
  status: 'started' | 'stopped' | 'failed';

  @IsOptional()
  @IsString()
  file_path?: string;

  @IsOptional()
  @IsNumber()
  file_size?: number;

  @IsOptional()
  @IsString()
  error?: string;
}

/**
 * DTO for updating recording metadata
 */
export class UpdateRecordingMetadataDto {
  @IsString()
  user_id: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  s3_bucket?: string;

  @IsOptional()
  @IsString()
  s3_key?: string;

  @IsOptional()
  @IsString()
  s3_url?: string;
}

/**
 * DTO for uploading client-side recording
 */
export class UploadRecordingDto {
  @IsString()
  meeting_id: string;

  @IsString()
  user_id: string;

  @IsOptional()
  @IsString()
  duration?: string;
}

/**
 * Response DTOs
 */
export interface RecordingResponse {
  recording_id: string;
  session_id?: string;
  meeting_id?: string;
  status: string;
  started_by?: string;
  stopped_by?: string;
  started_at?: Date;
  stopped_at?: Date;
  duration?: number;
  file_path?: string;
  file_size?: number;
  s3_url?: string;
  error?: string;
}

export interface StartRecordingResponse {
  recording_id: string;
  session_id: string;
  status: string;
  started_at: Date;
}

export interface StopRecordingResponse {
  recording_id: string;
  status: string;
  duration: number;
  stopped_at: Date;
}

export interface UploadRecordingResponse {
  success: boolean;
  recording_id: string;
  session_id: string;
  file_path: string;
  file_size: number;
  url: string;
  duration: number;
}

export interface RecordingListResponse {
  recordings: RecordingResponse[];
}
