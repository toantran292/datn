import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Folder, FolderDocument } from '../metadata/schemas/folder.schema';

export interface CreateFolderDto {
  name: string;
  parentId?: string | null;
  orgId: string;
  workspaceId: string;
  createdBy: string;
}

export interface FolderWithCounts extends Folder {
  id: string;
  fileCount: number;
  subfolderCount: number;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

@Injectable()
export class FolderService {
  private readonly logger = new Logger(FolderService.name);

  constructor(
    @InjectModel(Folder.name)
    private readonly folderModel: Model<FolderDocument>,
  ) {}

  async create(dto: CreateFolderDto): Promise<FolderDocument> {
    this.logger.log(`Creating folder "${dto.name}" in workspace ${dto.workspaceId}`);

    // Validate parent folder if provided
    let path: string[] = [];
    if (dto.parentId) {
      const parentFolder = await this.folderModel.findById(dto.parentId);
      if (!parentFolder) {
        throw new NotFoundException(`Parent folder ${dto.parentId} not found`);
      }
      if (parentFolder.workspaceId !== dto.workspaceId) {
        throw new BadRequestException('Parent folder belongs to different workspace');
      }
      // Build path from parent's path + parent's ID
      path = [...parentFolder.path, dto.parentId];
    }

    // Check for duplicate folder name in same location
    const existing = await this.folderModel.findOne({
      workspaceId: dto.workspaceId,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
      name: dto.name,
    });

    if (existing) {
      throw new BadRequestException(`Folder "${dto.name}" already exists in this location`);
    }

    const folder = new this.folderModel({
      name: dto.name,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
      orgId: dto.orgId,
      workspaceId: dto.workspaceId,
      createdBy: dto.createdBy,
      path,
    });

    const saved = await folder.save();
    this.logger.log(`Folder created: ${saved._id}`);

    return saved;
  }

  async findById(folderId: string): Promise<FolderDocument> {
    const folder = await this.folderModel.findById(folderId);
    if (!folder) {
      throw new NotFoundException(`Folder ${folderId} not found`);
    }
    return folder;
  }

  async listByWorkspace(
    workspaceId: string,
    parentId: string | null = null,
  ): Promise<FolderDocument[]> {
    const query: any = { workspaceId };

    if (parentId) {
      query.parentId = new Types.ObjectId(parentId);
    } else {
      query.parentId = null;
    }

    return this.folderModel.find(query).sort({ name: 1 }).exec();
  }

  async getBreadcrumb(folderId: string | null): Promise<BreadcrumbItem[]> {
    const breadcrumb: BreadcrumbItem[] = [{ id: null, name: 'Root' }];

    if (!folderId) {
      return breadcrumb;
    }

    const folder = await this.findById(folderId);

    // Get all parent folders from path
    if (folder.path && folder.path.length > 0) {
      const parentFolders = await this.folderModel
        .find({ _id: { $in: folder.path.map(id => new Types.ObjectId(id)) } })
        .exec();

      // Sort by path order
      const folderMap = new Map(parentFolders.map(f => [f._id.toString(), f]));
      for (const pathId of folder.path) {
        const pathFolder = folderMap.get(pathId);
        if (pathFolder) {
          breadcrumb.push({ id: pathFolder._id.toString(), name: pathFolder.name });
        }
      }
    }

    // Add current folder
    breadcrumb.push({ id: folder._id.toString(), name: folder.name });

    return breadcrumb;
  }

  async rename(folderId: string, newName: string): Promise<FolderDocument> {
    const folder = await this.findById(folderId);

    // Check for duplicate name
    const existing = await this.folderModel.findOne({
      workspaceId: folder.workspaceId,
      parentId: folder.parentId,
      name: newName,
      _id: { $ne: folder._id },
    });

    if (existing) {
      throw new BadRequestException(`Folder "${newName}" already exists in this location`);
    }

    folder.name = newName;
    return folder.save();
  }

  async move(folderId: string, newParentId: string | null): Promise<FolderDocument> {
    const folder = await this.findById(folderId);

    // Prevent moving folder into itself or its descendants
    if (newParentId) {
      const newParent = await this.findById(newParentId);
      if (newParent.path.includes(folderId) || newParentId === folderId) {
        throw new BadRequestException('Cannot move folder into itself or its descendants');
      }
    }

    // Update path
    let newPath: string[] = [];
    if (newParentId) {
      const newParent = await this.findById(newParentId);
      newPath = [...newParent.path, newParentId];
    }

    folder.parentId = newParentId ? new Types.ObjectId(newParentId) : null;
    folder.path = newPath;

    // Update all descendant folders' paths
    await this.updateDescendantPaths(folderId, folder.path);

    return folder.save();
  }

  private async updateDescendantPaths(parentId: string, parentPath: string[]): Promise<void> {
    const children = await this.folderModel.find({
      path: parentId,
    });

    for (const child of children) {
      // Find index of parentId in child's path and rebuild from there
      const pathIndex = child.path.indexOf(parentId);
      if (pathIndex !== -1) {
        const newChildPath = [...parentPath, parentId, ...child.path.slice(pathIndex + 1)];
        child.path = newChildPath;
        await child.save();
      }
    }
  }

  async delete(folderId: string): Promise<{ deleted: number }> {
    const folder = await this.findById(folderId);

    // Get all descendant folders
    const descendants = await this.folderModel.find({
      path: folderId,
    });

    const folderIdsToDelete = [folderId, ...descendants.map(d => d._id.toString())];

    // Delete all folders
    const result = await this.folderModel.deleteMany({
      _id: { $in: folderIdsToDelete.map(id => new Types.ObjectId(id)) },
    });

    this.logger.log(`Deleted ${result.deletedCount} folders (including descendants)`);

    return { deleted: result.deletedCount };
  }

  async getFileCount(folderId: string | null, fileModel: Model<any>): Promise<number> {
    const query: any = {};
    if (folderId) {
      query.folderId = new Types.ObjectId(folderId);
    } else {
      query.folderId = null;
    }
    return fileModel.countDocuments(query);
  }
}
