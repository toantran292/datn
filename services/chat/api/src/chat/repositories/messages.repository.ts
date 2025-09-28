// repositories/messages.repository.ts
import { Inject, Injectable } from "@nestjs/common";
import { mapping, types } from "cassandra-driver";
import { CASS_MAPPER } from "../../cassandra/cassandra.module";

export interface MessageEntity {
  id?: types.TimeUuid;
  roomId: types.TimeUuid;
  userId: types.Uuid;
  orgId: types.Uuid;
  text: string;
  sentAt: Date;
}

@Injectable()
export class MessagesRepository {
  private model: mapping.ModelMapper<MessageEntity>;

  constructor(@Inject(CASS_MAPPER) mapper: mapping.Mapper) {
    this.model = mapper.forModel<MessageEntity>("Message");
  }

  async create(msg: MessageEntity) {
    const entity = { ...msg, id: types.TimeUuid.now() };
    await this.model.insert(entity);
    return entity;
  }

  async findByRoom(roomId: types.TimeUuid, limit = 50) {
    const res = await this.model.find({ roomId }, { limit });
    return res.toArray();
  }
}
