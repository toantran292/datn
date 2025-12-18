import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MeController } from './me.controller';
import { MemberController } from './member.controller';
import { DashboardController } from './dashboard.controller';
import { SettingsController } from './settings.controller';
import { FilesController } from './files.controller';
import { WorkspaceFilesController } from './workspace-files.controller';
import { IdentityService } from '../services/identity.service';
import { PmService } from '../services/pm.service';
import { DashboardService } from './dashboard.service';
import { SettingsService } from './settings.service';
import { FilesService } from './files.service';
import { WorkspaceFilesService } from './workspace-files.service';

@Module({
  imports: [HttpModule],
  controllers: [
    MeController,
    MemberController,
    DashboardController,
    SettingsController,
    FilesController,
    WorkspaceFilesController,
  ],
  providers: [
    IdentityService,
    PmService,
    DashboardService,
    SettingsService,
    FilesService,
    WorkspaceFilesService,
  ],
})
export class TenantModule {}
