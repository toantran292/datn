import { Module } from '@nestjs/common';
import { FileStorageClient } from './file-storage.client';

@Module({
  providers: [FileStorageClient],
  exports: [FileStorageClient],
})
export class FileStorageModule {}
