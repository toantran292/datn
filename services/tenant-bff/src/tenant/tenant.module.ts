import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MeController } from './me.controller';
import { MemberController } from './member.controller';
import { DashboardController } from './dashboard.controller';
import { SettingsController } from './settings.controller';
import { FilesController } from './files.controller';
import { IdentityService } from '../services/identity.service';
import { PmService } from '../services/pm.service';
import { DashboardService } from './dashboard.service';
import { SettingsService } from './settings.service';
import { FilesService } from './files.service';

@Module({
  imports: [HttpModule],
  controllers: [MeController, MemberController, DashboardController, SettingsController, FilesController],
  providers: [IdentityService, PmService, DashboardService, SettingsService, FilesService],
})
export class TenantModule {}
