import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HmacGuard } from '../common/guards/hmac.guard';
import { FilesService } from './files.service';

@Controller('files')
@UseGuards(HmacGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * List files for the organization with optional filters
   */
  @Get()
  async listFiles(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    const orgId = req.orgId;
    return this.filesService.listFiles(orgId, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      search,
      type,
    });
  }

  /**
   * Get storage usage for the organization
   */
  @Get('storage')
  async getStorageUsage(@Req() req) {
    const orgId = req.orgId;
    return this.filesService.getStorageUsage(orgId);
  }

  /**
   * Upload a file
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req,
    @UploadedFile() file: any,
    @Body() body: { tags?: string; description?: string },
  ) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.filesService.uploadFile(orgId, userId, file, {
      tags: body.tags?.split(',').map((t) => t.trim()).filter(Boolean),
      description: body.description,
    });
  }

  /**
   * Get presigned upload URL for client-side upload
   */
  @Post('presigned-url')
  async getPresignedUrl(
    @Req() req,
    @Body() body: { fileName: string; mimeType: string; size: number },
  ) {
    const orgId = req.orgId;
    const userId = req.user?.id;

    return this.filesService.getPresignedUploadUrl(orgId, userId, body);
  }

  /**
   * Confirm upload completion
   */
  @Post('confirm-upload')
  async confirmUpload(@Req() req, @Body() body: { assetId: string }) {
    return this.filesService.confirmUpload(body.assetId);
  }

  /**
   * Get presigned download URL
   */
  @Post(':id/download-url')
  async getDownloadUrl(@Req() req, @Param('id') id: string) {
    return this.filesService.getPresignedDownloadUrl(id);
  }

  /**
   * Delete a file
   */
  @Delete(':id')
  async deleteFile(@Req() req, @Param('id') id: string) {
    const orgId = req.orgId;
    return this.filesService.deleteFile(orgId, id);
  }
}
