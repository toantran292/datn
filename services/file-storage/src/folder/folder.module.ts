import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';
import { Folder, FolderSchema } from '../metadata/schemas/folder.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Folder.name, schema: FolderSchema }]),
  ],
  controllers: [FolderController],
  providers: [FolderService],
  exports: [FolderService],
})
export class FolderModule {}
