import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DocumentType {
  PDF = 'application/pdf',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC = 'application/msword',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  XLS = 'application/vnd.ms-excel',
}

export class CreateDocumentUploadUrlDto {
  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({ description: 'MIME type of the file', enum: DocumentType })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  mimeType: DocumentType;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @IsNotEmpty()
  size: number;

  @ApiProperty({ description: 'Project ID', required: false })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ description: 'Organization ID', required: false })
  @IsString()
  @IsOptional()
  orgId?: string;

  @ApiProperty({ description: 'User ID', required: false })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class CreateDocumentUploadUrlResponseDto {
  @ApiProperty({ description: 'Asset ID for tracking the upload' })
  assetId: string;

  @ApiProperty({ description: 'Presigned URL to upload the file directly to storage' })
  presignedUrl: string;

  @ApiProperty({ description: 'Object key in storage' })
  objectKey: string;

  @ApiProperty({ description: 'URL expiry time in seconds' })
  expiresIn: number;
}

export class ConfirmDocumentUploadDto {
  @ApiProperty({ description: 'Asset ID from presigned URL creation' })
  @IsString()
  @IsNotEmpty()
  assetId: string;
}

export class ExtractDocumentTextDto {
  @ApiProperty({ description: 'Asset ID of the uploaded document' })
  @IsString()
  @IsNotEmpty()
  assetId: string;
}

export class ExtractDocumentTextResponseDto {
  @ApiProperty({ description: 'Extracted text content from document' })
  extractedText: string;

  @ApiProperty({ description: 'Number of pages processed (for PDFs)' })
  pageCount?: number;

  @ApiProperty({ description: 'Document metadata' })
  metadata: {
    fileName: string;
    mimeType: string;
    size: number;
  };
}
