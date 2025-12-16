import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { IdentityModule } from '../common/identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [InternalController],
})
export class InternalModule {}

