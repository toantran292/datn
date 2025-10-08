import { Controller, Get, Query } from "@nestjs/common";
import { ChatsService } from "./chat.service";

@Controller("messages")
export class ChatsController {
  constructor(private readonly chats: ChatsService) { }

  @Get()
  async list(
    @Query("roomId") roomId: string,
    @Query("pageSize") pageSize?: string,
    @Query("pageState") pageState?: string,
  ) {
    const size = pageSize ? Number(pageSize) : undefined;
    return this.chats.listMessages(roomId, { pageSize: size, pageState });
  }
}


