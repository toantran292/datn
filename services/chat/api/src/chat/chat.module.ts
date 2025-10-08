import { Module, forwardRef } from "@nestjs/common";
import { ChatsController } from "./chat.controller";
import { ChatsGateway } from "./chat.gateway";
import { ChatsService } from "./chat.service";
import { MessagesRepository } from "./repositories/messages.repository";
import { RoomsModule } from "../rooms/rooms.module";
import { RoomsRepository } from "../rooms/repositories/room.repository";

@Module({
  imports: [
    forwardRef(() => RoomsModule)
  ],
  providers: [ChatsGateway, ChatsService, MessagesRepository, RoomsRepository],
  controllers: [ChatsController],
  exports: [ChatsGateway, ChatsService],
})
export class ChatModule { }
