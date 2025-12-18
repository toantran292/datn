import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MeController } from './me.controller';
import { MemberController } from './member.controller';
import { DashboardController } from './dashboard.controller';
import { SettingsController } from './settings.controller';
import { FilesController } from './files.controller';
import { WorkspaceFilesController } from './workspace-files.controller';
import { AgentController } from './agent/agent.controller';
import { IdentityService } from '../services/identity.service';
import { PmService } from '../services/pm.service';
import { DashboardService } from './dashboard.service';
import { SettingsService } from './settings.service';
import { FilesService } from './files.service';
import { WorkspaceFilesService } from './workspace-files.service';
import { AgentService } from './agent/agent.service';
import { RagClientModule } from '../common/rag/rag.module';

@Module({
  imports: [HttpModule, RagClientModule],
  controllers: [
    MeController,
    MemberController,
    DashboardController,
    SettingsController,
    FilesController,
    WorkspaceFilesController,
    AgentController,
  ],
  providers: [
    IdentityService,
    PmService,
    DashboardService,
    SettingsService,
    FilesService,
    WorkspaceFilesService,
    AgentService,
  ],
})
export class TenantModule {}
