import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  HttpStatus,
} from '@nestjs/common';
import { FolderService } from './folder.service';

class CreateFolderBodyDto {
  name: string;
  parentId?: string | null;
  workspaceId: string;
}

class RenameFolderBodyDto {
  name: string;
}

class MoveFolderBodyDto {
  parentId: string | null;
}

@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  async createFolder(
    @Body() dto: CreateFolderBodyDto,
    @Headers('x-org-id') orgId: string,
    @Headers('x-user-id') userId: string,
  ) {
    const folder = await this.folderService.create({
      name: dto.name,
      parentId: dto.parentId,
      orgId,
      workspaceId: dto.workspaceId,
      createdBy: userId,
    });

    return {
      statusCode: HttpStatus.CREATED,
      data: {
        id: folder._id.toString(),
        name: folder.name,
        parentId: folder.parentId?.toString() || null,
        workspaceId: folder.workspaceId,
        createdAt: folder.createdAt,
      },
      message: 'Folder created successfully',
    };
  }

  @Get()
  async listFolders(
    @Query('workspaceId') workspaceId: string,
    @Query('parentId') parentId: string | null,
  ) {
    const folders = await this.folderService.listByWorkspace(
      workspaceId,
      parentId === 'null' || parentId === '' ? null : parentId,
    );

    return {
      statusCode: HttpStatus.OK,
      data: {
        folders: folders.map(f => ({
          id: f._id.toString(),
          name: f.name,
          parentId: f.parentId?.toString() || null,
          workspaceId: f.workspaceId,
          createdBy: f.createdBy,
          createdAt: f.createdAt,
        })),
      },
    };
  }

  @Get(':id')
  async getFolder(@Param('id') id: string) {
    const folder = await this.folderService.findById(id);

    return {
      statusCode: HttpStatus.OK,
      data: {
        id: folder._id.toString(),
        name: folder.name,
        parentId: folder.parentId?.toString() || null,
        workspaceId: folder.workspaceId,
        path: folder.path,
        createdBy: folder.createdBy,
        createdAt: folder.createdAt,
      },
    };
  }

  @Get(':id/breadcrumb')
  async getBreadcrumb(@Param('id') id: string) {
    const breadcrumb = await this.folderService.getBreadcrumb(
      id === 'null' || id === 'root' ? null : id,
    );

    return {
      statusCode: HttpStatus.OK,
      data: { breadcrumb },
    };
  }

  @Patch(':id/rename')
  async renameFolder(
    @Param('id') id: string,
    @Body() dto: RenameFolderBodyDto,
  ) {
    const folder = await this.folderService.rename(id, dto.name);

    return {
      statusCode: HttpStatus.OK,
      data: {
        id: folder._id.toString(),
        name: folder.name,
      },
      message: 'Folder renamed successfully',
    };
  }

  @Patch(':id/move')
  async moveFolder(
    @Param('id') id: string,
    @Body() dto: MoveFolderBodyDto,
  ) {
    const folder = await this.folderService.move(id, dto.parentId);

    return {
      statusCode: HttpStatus.OK,
      data: {
        id: folder._id.toString(),
        parentId: folder.parentId?.toString() || null,
        path: folder.path,
      },
      message: 'Folder moved successfully',
    };
  }

  @Delete(':id')
  async deleteFolder(@Param('id') id: string) {
    const result = await this.folderService.delete(id);

    return {
      statusCode: HttpStatus.OK,
      data: result,
      message: 'Folder deleted successfully',
    };
  }
}
