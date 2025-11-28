export interface FileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  url?: string;
  service: string;
  modelType: string;
  subjectId: string;
  uploadedBy?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  uploadStatus: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePresignedUrlRequest {
  originalName: string;
  mimeType: string;
  size: number;
  service: string;
  modelType: string;
  subjectId: string;
  uploadedBy?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreatePresignedUrlResponse {
  assetId: string;
  presignedUrl: string;
  objectKey: string;
  expiresIn: number; // seconds
}

export interface ConfirmUploadRequest {
  assetId: string;
}

export interface UploadFileRequest {
  service: string;
  modelType: string;
  subjectId: string;
  uploadedBy?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface FileListQuery {
  service?: string;
  modelType?: string;
  subjectId?: string;
  uploadedBy?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}
