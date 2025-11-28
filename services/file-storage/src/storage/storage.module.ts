import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { FileStorageService } from './file-storage.service';
import { FileStorageController } from './file-storage.controller';
import { MetadataModule } from '../metadata/metadata.module';

@Module({
  imports: [MetadataModule],
  controllers: [FileStorageController],
  providers: [MinioService, FileStorageService],
  exports: [FileStorageService],
})
export class StorageModule {}
