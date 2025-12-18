import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WorkspacesController } from './workspaces.controller.js';
import { DashboardController } from './dashboard.controller.js';
import { UsersController } from './users.controller.js';
import { IdentityService } from '../services/identity.service.js';
import { SuperAdminGuard } from '../common/guards/super-admin.guard.js';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  controllers: [WorkspacesController, DashboardController, UsersController],
  providers: [IdentityService, SuperAdminGuard],
  exports: [IdentityService],
})
export class AdminModule {}
