import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetadataService } from './metadata.service';
import {
  FileMetadata,
  FileMetadataSchema,
} from './schemas/file-metadata.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FileMetadata.name, schema: FileMetadataSchema },
    ]),
  ],
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
