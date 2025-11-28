import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectModule } from "./modules/project/project.module";
import { SprintModule } from "./modules/sprint/sprint.module";
import { IssueModule } from "./modules/issue/issue.module";
import { IssueStatusModule } from "./modules/issue-status/issue-status.module";
import { OrgIdGuard } from "./common/guards";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ProjectModule,
    SprintModule,
    IssueModule,
    IssueStatusModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: OrgIdGuard,
    },
  ],
})
export class AppModule {}
