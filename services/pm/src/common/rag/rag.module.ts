import { Global, Module } from '@nestjs/common';
import { RagClient } from './rag.client';

@Global()
@Module({
  providers: [RagClient],
  exports: [RagClient],
})
export class RagModule {}
