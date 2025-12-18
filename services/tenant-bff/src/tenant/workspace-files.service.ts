import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ListWorkspaceFilesOptions {
  folderId?: string | null;
  search?: string;
  type?: string;
  sortBy?: 'name' | 'size' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface WorkspaceMember {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

@Injectable()
export class WorkspaceFilesService {
  private readonly logger = new Logger(WorkspaceFilesService.name);
  private readonly fileStorageBaseUrl: string;
  private readonly identityBaseUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.fileStorageBaseUrl = this.config.get(
      'FILE_STORAGE_URL',
      'http://file-storage-api:3000',
    );
    this.identityBaseUrl = this.config.get(
      'IDENTITY_URL',
      'http://identity-api:3000',
    );
  }

  /**
   * Check if user is member of workspace and return their role
   */
  async checkMembership(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    try {
      const res = await firstValueFrom(
        this.http.get(`${this.identityBaseUrl}/organizations/${workspaceId}/members/${userId}`, {
          headers: { 'X-Internal-Call': 'bff' },
        }),
      );
      return res.data?.data || null;
    } catch (err) {
      if (err.response?.status === 404) return null;
      this.logger.error(`Failed to check membership: ${err.message}`);
      return null;
    }
  }

  /**
   * List files in workspace with folder support (UC14)
   */
  async listFiles(
    orgId: string,
    workspaceId: string,
    userId: string,
    options: ListWorkspaceFilesOptions,
  ) {
    // Check membership
    const membership = await this.checkMembership(workspaceId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const url = `${this.fileStorageBaseUrl}/files`;

    try {
      const params: Record<string, any> = {
        workspaceId,
        page: options.page || 1,
        limit: options.limit || 50,
      };

      if (options.folderId !== undefined) {
        params.folderId = options.folderId || 'null';
      }

      if (options.search) {
        params.search = options.search;
      }

      if (options.type && options.type !== 'all') {
        params.mimeType = this.getMimeTypePrefix(options.type);
      }

      if (options.sortBy) {
        params.sortBy = options.sortBy;
      }

      if (options.sortOrder) {
        params.sortOrder = options.sortOrder;
      }

      const [filesRes, foldersRes, breadcrumb] = await Promise.all([
        firstValueFrom(
          this.http.get(url, {
            headers: {
              'X-Internal-Call': 'bff',
              'X-Org-Id': orgId,
            },
            params,
          }),
        ),
        this.listFolders(workspaceId, options.folderId),
        this.getBreadcrumb(options.folderId),
      ]);

      const data = filesRes.data?.data || {};

      return {
        files: (data.files || []).map((file: any) => this.transformFile(file)),
        folders: foldersRes,
        breadcrumb,
        pagination: {
          total: data.total || 0,
          page: data.page || options.page || 1,
          limit: data.limit || options.limit || 50,
          totalPages: data.totalPages || 0,
        },
      };
    } catch (err) {
      this.logger.error(`Failed to list workspace files: ${err.message}`);
      return {
        files: [],
        folders: [],
        breadcrumb: [{ id: null, name: 'Root' }],
        pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
      };
    }
  }

  /**
   * List folders in workspace (UC14)
   */
  async listFolders(workspaceId: string, parentId?: string | null) {
    const url = `${this.fileStorageBaseUrl}/folders`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-Internal-Call': 'bff' },
          params: {
            workspaceId,
            parentId: parentId || 'null',
          },
        }),
      );

      return (res.data?.data?.folders || []).map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        createdAt: folder.createdAt,
      }));
    } catch (err) {
      this.logger.error(`Failed to list folders: ${err.message}`);
      return [];
    }
  }

  /**
   * Get breadcrumb for folder navigation (UC14)
   */
  async getBreadcrumb(folderId?: string | null) {
    if (!folderId) {
      return [{ id: null, name: 'Root' }];
    }

    const url = `${this.fileStorageBaseUrl}/folders/${folderId}/breadcrumb`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: { 'X-Internal-Call': 'bff' },
        }),
      );

      return res.data?.data?.breadcrumb || [{ id: null, name: 'Root' }];
    } catch (err) {
      this.logger.error(`Failed to get breadcrumb: ${err.message}`);
      return [{ id: null, name: 'Root' }];
    }
  }

  /**
   * Create folder (UC14)
   */
  async createFolder(
    orgId: string,
    workspaceId: string,
    userId: string,
    name: string,
    parentId?: string | null,
  ) {
    const membership = await this.checkMembership(workspaceId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const url = `${this.fileStorageBaseUrl}/folders`;

    try {
      const res = await firstValueFrom(
        this.http.post(
          url,
          { name, parentId, workspaceId },
          {
            headers: {
              'X-Internal-Call': 'bff',
              'X-Org-Id': orgId,
              'X-User-Id': userId,
            },
          },
        ),
      );

      return res.data?.data;
    } catch (err) {
      this.logger.error(`Failed to create folder: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Delete folder (UC14 - Owner/Admin only)
   */
  async deleteFolder(
    orgId: string,
    workspaceId: string,
    userId: string,
    folderId: string,
  ) {
    const membership = await this.checkMembership(workspaceId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (!['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new ForbiddenException('Only Owner or Admin can delete folders');
    }

    const url = `${this.fileStorageBaseUrl}/folders/${folderId}`;

    try {
      const res = await firstValueFrom(
        this.http.delete(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );

      return res.data?.data;
    } catch (err) {
      this.logger.error(`Failed to delete folder: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Move file to folder (UC14)
   */
  async moveFile(
    orgId: string,
    workspaceId: string,
    userId: string,
    fileId: string,
    folderId: string | null,
  ) {
    const membership = await this.checkMembership(workspaceId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const url = `${this.fileStorageBaseUrl}/files/${fileId}/move`;

    try {
      const res = await firstValueFrom(
        this.http.patch(
          url,
          { folderId },
          {
            headers: {
              'X-Internal-Call': 'bff',
              'X-Org-Id': orgId,
            },
          },
        ),
      );

      return {
        success: true,
        file: this.transformFile(res.data?.data),
      };
    } catch (err) {
      this.logger.error(`Failed to move file: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Delete file (UC14 - Owner/Admin only)
   */
  async deleteFile(
    orgId: string,
    workspaceId: string,
    userId: string,
    fileId: string,
  ) {
    const membership = await this.checkMembership(workspaceId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (!['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new ForbiddenException('Only Owner or Admin can delete files');
    }

    const url = `${this.fileStorageBaseUrl}/files/${fileId}`;

    try {
      await firstValueFrom(
        this.http.delete(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );

      return { success: true, message: 'File deleted successfully' };
    } catch (err) {
      this.logger.error(`Failed to delete file: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Batch delete files (UC14 - Owner/Admin only)
   */
  async batchDeleteFiles(
    orgId: string,
    workspaceId: string,
    userId: string,
    fileIds: string[],
  ) {
    const membership = await this.checkMembership(workspaceId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (!['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new ForbiddenException('Only Owner or Admin can delete files');
    }

    const results = await Promise.allSettled(
      fileIds.map((fileId) =>
        firstValueFrom(
          this.http.delete(`${this.fileStorageBaseUrl}/files/${fileId}`, {
            headers: {
              'X-Internal-Call': 'bff',
              'X-Org-Id': orgId,
            },
          }),
        ),
      ),
    );

    const deleted = results.filter((r) => r.status === 'fulfilled').length;
    const failed = fileIds.filter(
      (_, i) => results[i].status === 'rejected',
    );

    return {
      message: `${deleted} files deleted successfully`,
      deleted,
      failed,
    };
  }

  /**
   * Get file details (UC14)
   */
  async getFile(
    orgId: string,
    workspaceId: string,
    userId: string,
    fileId: string,
  ) {
    const membership = await this.checkMembership(workspaceId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const url = `${this.fileStorageBaseUrl}/files/${fileId}`;

    try {
      const res = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'X-Internal-Call': 'bff',
            'X-Org-Id': orgId,
          },
        }),
      );

      return this.transformFile(res.data?.data);
    } catch (err) {
      if (err.response?.status === 404) {
        throw new NotFoundException('File not found');
      }
      this.logger.error(`Failed to get file: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Get download URL (UC14)
   */
  async getDownloadUrl(
    orgId: string,
    workspaceId: string,
    userId: string,
    fileId: string,
  ) {
    const membership = await this.checkMembership(workspaceId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const url = `${this.fileStorageBaseUrl}/files/presigned-get-url`;

    try {
      const res = await firstValueFrom(
        this.http.post(
          url,
          { id: fileId, expirySeconds: 900 }, // 15 minutes
          {
            headers: { 'X-Internal-Call': 'bff' },
          },
        ),
      );

      return {
        downloadUrl: res.data?.data?.presignedUrl,
        expiresAt: new Date(Date.now() + 900 * 1000).toISOString(),
      };
    } catch (err) {
      this.logger.error(`Failed to get download URL: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  /**
   * Upload file to workspace folder (UC14)
   */
  async getPresignedUploadUrl(
    orgId: string,
    workspaceId: string,
    userId: string,
    fileInfo: { fileName: string; mimeType: string; size: number; folderId?: string | null },
  ) {
    const membership = await this.checkMembership(workspaceId, userId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const url = `${this.fileStorageBaseUrl}/files/presigned-url`;

    try {
      const res = await firstValueFrom(
        this.http.post(
          url,
          {
            originalName: fileInfo.fileName,
            mimeType: fileInfo.mimeType,
            size: fileInfo.size,
            service: 'workspace',
            modelType: 'file',
            subjectId: workspaceId,
            orgId,
            workspaceId,
            folderId: fileInfo.folderId,
            uploadedBy: userId,
          },
          {
            headers: {
              'X-Internal-Call': 'bff',
              'X-Org-Id': orgId,
              'X-User-Id': userId,
            },
          },
        ),
      );

      return res.data?.data;
    } catch (err) {
      this.logger.error(`Failed to get presigned URL: ${err.message}`);
      throw err.response?.data ?? err;
    }
  }

  private transformFile(file: any) {
    if (!file) return null;

    return {
      id: file.id,
      name: file.originalName,
      type: this.getFileType(file.mimeType),
      mimeType: file.mimeType,
      size: file.size,
      sizeFormatted: this.formatSize(file.size),
      folderId: file.folderId || null,
      uploadedBy: {
        id: file.uploadedBy,
        name: 'User', // Would need to fetch user info
      },
      createdAt: file.createdAt,
      isUsedInReports: false, // TODO: implement check
    };
  }

  private getFileType(mimeType: string): string {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv'))
      return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
      return 'presentation';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'other';
  }

  private getMimeTypePrefix(type: string): string {
    switch (type) {
      case 'image':
        return 'image/';
      case 'pdf':
        return 'application/pdf';
      case 'document':
        return 'application/';
      case 'spreadsheet':
        return 'application/vnd';
      default:
        return '';
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}
