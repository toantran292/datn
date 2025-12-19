import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagClient } from './rag.client';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RagClient],
  exports: [RagClient],
})
export class RagClientModule {}
