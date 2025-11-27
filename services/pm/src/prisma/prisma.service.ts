import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();  // ← Kết nối khi app start
  }

  async onModuleDestroy() {
    await this.$disconnect();  // ← Đóng connection khi app stop
  }
}
