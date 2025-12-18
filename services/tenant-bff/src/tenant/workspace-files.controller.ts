import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HmacGuard } from '../common/guards/hmac.guard';
import { WorkspaceFilesService } from './workspace-files.service';

@Controller('workspace/:workspaceId/files')
@UseGuards(HmacGuard)
export class WorkspaceFilesController {
  constructor(private readonly workspaceFilesService: WorkspaceFilesService) {}

  /**
   * List files in workspace with folder support (UC14)
   */
  @Get()
  async listFiles(
    @Req() req,
    @Param('workspaceId') workspaceId: string,
    @Query('folderId') folderId?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('sortBy') sortBy?: 'name' | 'size' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.workspaceFilesService.listFiles(orgId, workspaceId, userId, {
      folderId: folderId === 'null' ? null : folderId,
      search,
      type,
      sortBy,
      sortOrder,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '50', 10),
    });
  }

  /**
   * Get file details (UC14)
   */
  @Get(':fileId')
  async getFile(
    @Req() req,
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
  ) {
    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.workspaceFilesService.getFile(orgId, workspaceId, userId, fileId);
  }

  /**
   * Get download URL for file (UC14)
   */
  @Post(':fileId/download-url')
  async getDownloadUrl(
    @Req() req,
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
  ) {
    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.workspaceFilesService.getDownloadUrl(orgId, workspaceId, userId, fileId);
  }

  /**
   * Get presigned upload URL (UC14)
   */
  @Post('upload/presigned-url')
  async getPresignedUploadUrl(
    @Req() req,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { fileName: string; mimeType: string; size: number; folderId?: string },
  ) {
    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.workspaceFilesService.getPresignedUploadUrl(orgId, workspaceId, userId, body);
  }

  /**
   * Move file to folder (UC14)
   */
  @Patch(':fileId/move')
  async moveFile(
    @Req() req,
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
    @Body() body: { folderId: string | null },
  ) {
    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.workspaceFilesService.moveFile(
      orgId,
      workspaceId,
      userId,
      fileId,
      body.folderId,
    );
  }

  /**
   * Delete file (UC14 - Owner/Admin only)
   */
  @Delete(':fileId')
  async deleteFile(
    @Req() req,
    @Param('workspaceId') workspaceId: string,
    @Param('fileId') fileId: string,
  ) {
    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.workspaceFilesService.deleteFile(orgId, workspaceId, userId, fileId);
  }

  /**
   * Batch delete files (UC14 - Owner/Admin only)
   */
  @Delete()
  async batchDeleteFiles(
    @Req() req,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { fileIds: string[] },
  ) {
    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.workspaceFilesService.batchDeleteFiles(
      orgId,
      workspaceId,
      userId,
      body.fileIds,
    );
  }

  /**
   * Create folder (UC14)
   */
  @Post('folders')
  async createFolder(
    @Req() req,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { name: string; parentId?: string },
  ) {
    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.workspaceFilesService.createFolder(
      orgId,
      workspaceId,
      userId,
      body.name,
      body.parentId,
    );
  }

  /**
   * Delete folder (UC14 - Owner/Admin only)
   */
  @Delete('folders/:folderId')
  async deleteFolder(
    @Req() req,
    @Param('workspaceId') workspaceId: string,
    @Param('folderId') folderId: string,
  ) {
    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.workspaceFilesService.deleteFolder(orgId, workspaceId, userId, folderId);
  }
}
