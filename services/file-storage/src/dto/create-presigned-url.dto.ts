import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreatePresignedUrlDto {
  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsString()
  service: string;

  @IsString()
  modelType: string;

  @IsString()
  subjectId: string;

  @IsOptional()
  @IsString()
  uploadedBy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}
