import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  MinLength,
} from 'class-validator';

export class UploadFileDto {
  @IsString()
  @MinLength(1)
  service: string;

  @IsString()
  @MinLength(1)
  modelType: string;

  @IsString()
  @MinLength(1)
  subjectId: string;

  @IsOptional()
  @IsString()
  uploadedBy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
