import { Module, forwardRef } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ChatsController } from "./chat.controller";
import { ChatsGateway } from "./chat.gateway";
import { ChatsService } from "./chat.service";
import { MessagesRepository } from "./repositories/messages.repository";
import { ReactionsRepository } from "./repositories/reactions.repository";
import { PinnedMessagesRepository } from "./repositories/pinned-messages.repository";
import { AttachmentsRepository } from "./repositories/attachments.repository";
import { SearchRepository } from "./repositories/search.repository";
import { NotificationSettingsRepository } from "./repositories/notification-settings.repository";
import { RoomsModule } from "../rooms/rooms.module";
import { RoomsRepository } from "../rooms/repositories/room.repository";
import { PresenceModule } from "../common/presence/presence.module";
import { IdentityModule } from "../common/identity/identity.module";
import { FileStorageModule } from "../common/file-storage/file-storage.module";

@Module({
  imports: [
    forwardRef(() => RoomsModule),
    HttpModule,
    PresenceModule,
    IdentityModule,
    FileStorageModule,
  ],
  providers: [
    ChatsGateway,
    ChatsService,
    MessagesRepository,
    ReactionsRepository,
    PinnedMessagesRepository,
    AttachmentsRepository,
    SearchRepository,
    NotificationSettingsRepository,
    RoomsRepository,
  ],
  controllers: [ChatsController],
  exports: [ChatsGateway, ChatsService, MessagesRepository, AttachmentsRepository],
})
export class ChatModule { }
