import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileStorageClient } from './file-storage.client';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [FileStorageClient],
  exports: [FileStorageClient],
})
export class FileStorageModule {}
