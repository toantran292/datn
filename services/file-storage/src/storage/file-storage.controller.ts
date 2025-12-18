import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
  Patch,
  Headers,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileStorageService } from './file-storage.service';
import { UploadFileDto } from '../dto/upload-file.dto';
import { QueryFilesDto } from '../dto/query-files.dto';
import { CreatePresignedUrlDto } from '../dto/create-presigned-url.dto';
import { ConfirmUploadDto } from '../dto/confirm-upload.dto';
import {
  PresignedGetUrlDto,
  PresignedGetUrlsDto,
} from '../dto/presigned-get-url.dto';

@Controller('files')
export class FileStorageController {
  constructor(private readonly fileStorageService: FileStorageService) {}

  /**
   * NEW: Create presigned URL for client-side upload
   * This is the recommended flow
   */
  @Post('presigned-url')
  async createPresignedUrl(@Body() dto: CreatePresignedUrlDto) {
    const result = await this.fileStorageService.createPresignedUrl(dto);

    return {
      statusCode: HttpStatus.CREATED,
      data: result,
      message: 'Presigned URL created successfully',
    };
  }

  /**
   * NEW: Confirm that file upload is completed
   */
  @Post('confirm-upload')
  async confirmUpload(@Body() dto: ConfirmUploadDto) {
    const metadata = await this.fileStorageService.confirmUpload(dto.assetId);

    return {
      statusCode: HttpStatus.OK,
      data: metadata,
      message: 'Upload confirmed successfully',
    };
  }

  /**
   * Generate presigned GET URL for a single file by ID
   */
  @Post('presigned-get-url')
  async getPresignedGetUrl(@Body() dto: PresignedGetUrlDto) {
    const result = await this.fileStorageService.getPresignedGetUrl(
      dto.id,
      dto.expirySeconds || 3600,
    );

    return {
      statusCode: HttpStatus.OK,
      data: result,
      message: 'Presigned GET URL generated successfully',
    };
  }

  /**
   * Generate presigned GET URLs for multiple files by IDs
   */
  @Post('presigned-get-urls')
  async getPresignedGetUrls(@Body() dto: PresignedGetUrlsDto) {
    const result = await this.fileStorageService.getPresignedGetUrls(
      dto.ids,
      dto.expirySeconds || 3600,
    );

    return {
      statusCode: HttpStatus.OK,
      data: result,
      message: 'Presigned GET URLs generated successfully',
    };
  }

  /**
   * LEGACY: Direct upload via multipart/form-data
   * Keep for backward compatibility
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    if (!file) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'No file provided',
      };
    }

    const metadata = await this.fileStorageService.uploadFile(file, dto);

    return {
      statusCode: HttpStatus.CREATED,
      data: metadata,
      message: 'File uploaded successfully',
    };
  }

  @Get()
  async listFiles(@Query() query: QueryFilesDto) {
    const result = await this.fileStorageService.listFiles(query);

    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'file-storage-api',
      timestamp: new Date(),
    };
  }

  /**
   * Get storage usage for an organization
   * Called by tenant-bff for dashboard stats
   */
  @Get('storage/usage')
  async getStorageUsage(@Headers('x-org-id') orgId: string) {
    if (!orgId) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'X-Org-Id header is required',
      };
    }

    const result = await this.fileStorageService.getStorageUsage(orgId);

    return {
      statusCode: HttpStatus.OK,
      data: result,
    };
  }

  /**
   * Get recent files for an organization
   * Called by tenant-bff for dashboard
   */
  @Get('recent')
  async getRecentFiles(
    @Headers('x-org-id') orgId: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    if (!orgId) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'X-Org-Id header is required',
      };
    }

    const files = await this.fileStorageService.getRecentFiles(orgId, limit);

    return {
      statusCode: HttpStatus.OK,
      data: { files },
    };
  }

  @Get(':id')
  async getFile(@Param('id') id: string) {
    const metadata = await this.fileStorageService.getFile(id);

    return {
      statusCode: HttpStatus.OK,
      data: metadata,
    };
  }

  @Get(':id/download')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { buffer, metadata } = await this.fileStorageService.downloadFile(id);

    res.set({
      'Content-Type': metadata.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata.originalName)}"`,
      'Content-Length': metadata.size,
    });

    res.send(buffer);
  }

  @Patch(':id')
  async updateMetadata(
    @Param('id') id: string,
    @Body() updates: { tags?: string[]; metadata?: Record<string, any> },
  ) {
    const metadata = await this.fileStorageService.updateMetadata(id, updates);

    return {
      statusCode: HttpStatus.OK,
      data: metadata,
      message: 'Metadata updated successfully',
    };
  }

  /**
   * Move file to a different folder (UC14)
   */
  @Patch(':id/move')
  async moveFile(
    @Param('id') id: string,
    @Body() body: { folderId: string | null },
  ) {
    const metadata = await this.fileStorageService.moveFile(id, body.folderId);

    return {
      statusCode: HttpStatus.OK,
      data: metadata,
      message: 'File moved successfully',
    };
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    await this.fileStorageService.deleteFile(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'File deleted successfully',
    };
  }

  @Delete('subject/:service/:modelType/:subjectId')
  async deleteFilesBySubject(
    @Param('service') service: string,
    @Param('modelType') modelType: string,
    @Param('subjectId') subjectId: string,
  ) {
    const deletedCount = await this.fileStorageService.deleteFilesBySubject(
      service,
      modelType,
      subjectId,
    );

    return {
      statusCode: HttpStatus.OK,
      data: { deletedCount },
      message: `${deletedCount} files deleted successfully`,
    };
  }
}
