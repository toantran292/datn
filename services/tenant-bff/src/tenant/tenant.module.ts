import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { MemberController } from './member.controller';
import { IdentityService } from 'src/services/identity.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [MeController, MemberController],
  providers: [IdentityService],
})
export class TenantModule {}
