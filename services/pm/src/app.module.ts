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
import { IssueCommentModule } from "./modules/issue-comment/issue-comment.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AIModule } from "./modules/ai/ai.module";
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
    IssueCommentModule,
    AnalyticsModule,
    AIModule,
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
