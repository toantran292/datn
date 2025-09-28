import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { MessagesRepository } from "./repositories/messages.repository";

@Module({
  providers: [ChatGateway, ChatService, MessagesRepository],
})
export class ChatModule { }
