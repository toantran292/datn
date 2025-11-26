import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InvitationController } from './invitation.controller';
import { IdentityService } from 'src/services/identity.service';

@Module({
  imports: [HttpModule],
  controllers: [InvitationController],
  providers: [IdentityService],
})
export class PublicModule {}
