import { Inject, Injectable } from "@nestjs/common";
import { mapping, types } from "cassandra-driver";
import { CASS_MAPPER } from "../../cassandra/cassandra.module";

export interface MessageEntity {
  id?: types.TimeUuid;
  roomId: types.TimeUuid;
  userId: types.Uuid;
  orgId: types.Uuid;
  threadId?: types.TimeUuid | null;
  type: string;
  content: string;
  sendAt?: Date;
}

export interface PersistedMessage {
  id: types.TimeUuid;
  roomId: types.TimeUuid;
  userId: types.Uuid;
  orgId: types.Uuid;
  threadId: types.TimeUuid | null;
  type: string;
  content: string;
  sendAt: Date;
}

@Injectable()
export class MessagesRepository {
  private model: mapping.ModelMapper<MessageEntity>;

  constructor(@Inject(CASS_MAPPER) mapper: mapping.Mapper) {
    this.model = mapper.forModel<MessageEntity>("Message");
  }

  async create(msg: MessageEntity): Promise<PersistedMessage> {
    const id = msg.id ?? types.TimeUuid.now();
    const sendAt = msg.sendAt ?? new Date();

    const dbPayload: MessageEntity = {
      id,
      roomId: msg.roomId,
      userId: msg.userId,
      orgId: msg.orgId,
      threadId: msg.threadId ?? null,
      type: msg.type,
      content: msg.content,
      sendAt,
    };

    await this.model.insert(dbPayload as any);

    return {
      id,
      roomId: msg.roomId,
      userId: msg.userId,
      orgId: msg.orgId,
      threadId: msg.threadId ?? null,
      type: msg.type,
      content: msg.content,
      sendAt,
    };
  }

  async listByRoom(
    roomId: types.TimeUuid,
    opts: { pageSize?: number; pageState?: string } = {},
  ): Promise<{ items: PersistedMessage[]; pageState?: string }> {
    const rs = await this.model.find({ roomId }, {
      fetchSize: opts.pageSize ?? 50,
      pageState: opts.pageState,
      orderBy: { sendAt: "ASC", id: "ASC" },
    } as any);

    const items: PersistedMessage[] = rs.toArray().map(row => ({
      id: row.id!,
      roomId: row.roomId,
      userId: row.userId,
      orgId: row.orgId,
      threadId: row.threadId ?? null,
      type: row.type,
      content: row.content,
      sendAt: row.sendAt!,
    }));

    return { items, pageState: (rs as any).pageState ?? undefined };
  }
}
