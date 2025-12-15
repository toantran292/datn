import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MeController } from './me.controller';
import { MemberController } from './member.controller';
import { DashboardController } from './dashboard.controller';
import { IdentityService } from '../services/identity.service';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [HttpModule],
  controllers: [MeController, MemberController, DashboardController],
  providers: [IdentityService, DashboardService],
})
export class TenantModule {}
