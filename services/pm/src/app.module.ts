import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectModule } from "./modules/project/project.module";
import { SprintModule } from "./modules/sprint/sprint.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ProjectModule,
    SprintModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
