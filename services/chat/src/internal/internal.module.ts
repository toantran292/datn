import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { IdentityModule } from '../common/identity/identity.module';
import { PresenceModule } from '../common/presence/presence.module';

@Module({
  imports: [IdentityModule, PresenceModule],
  controllers: [InternalController],
})
export class InternalModule {}

