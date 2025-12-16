import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageAttachment } from '../../database/entities/message-attachment.entity';

export interface AttachmentEntity {
  id: string;
  messageId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl: string | null;
  createdAt: Date;
}

export interface CreateAttachmentDto {
  messageId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
}

@Injectable()
export class AttachmentsRepository {
  constructor(
    @InjectRepository(MessageAttachment)
    private readonly attachmentRepo: Repository<MessageAttachment>,
  ) {}

  async create(dto: CreateAttachmentDto): Promise<AttachmentEntity> {
    const entity = this.attachmentRepo.create({
      messageId: dto.messageId,
      fileId: dto.fileId,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      thumbnailUrl: dto.thumbnailUrl || null,
    });

    const saved = await this.attachmentRepo.save(entity);

    return {
      id: saved.id,
      messageId: saved.messageId,
      fileId: saved.fileId,
      fileName: saved.fileName,
      fileSize: Number(saved.fileSize),
      mimeType: saved.mimeType,
      thumbnailUrl: saved.thumbnailUrl,
      createdAt: saved.createdAt,
    };
  }

  async findById(id: string): Promise<AttachmentEntity | null> {
    const attachment = await this.attachmentRepo.findOne({
      where: { id },
    });

    if (!attachment) return null;

    return {
      id: attachment.id,
      messageId: attachment.messageId,
      fileId: attachment.fileId,
      fileName: attachment.fileName,
      fileSize: Number(attachment.fileSize),
      mimeType: attachment.mimeType,
      thumbnailUrl: attachment.thumbnailUrl,
      createdAt: attachment.createdAt,
    };
  }

  async findByMessageId(messageId: string): Promise<AttachmentEntity[]> {
    const attachments = await this.attachmentRepo.find({
      where: { messageId },
      order: { createdAt: 'ASC' },
    });

    return attachments.map(a => ({
      id: a.id,
      messageId: a.messageId,
      fileId: a.fileId,
      fileName: a.fileName,
      fileSize: Number(a.fileSize),
      mimeType: a.mimeType,
      thumbnailUrl: a.thumbnailUrl,
      createdAt: a.createdAt,
    }));
  }

  async findByMessageIds(messageIds: string[]): Promise<Map<string, AttachmentEntity[]>> {
    if (messageIds.length === 0) return new Map();

    const attachments = await this.attachmentRepo.find({
      where: messageIds.map(id => ({ messageId: id })),
      order: { createdAt: 'ASC' },
    });

    const result = new Map<string, AttachmentEntity[]>();

    for (const a of attachments) {
      const list = result.get(a.messageId) || [];
      list.push({
        id: a.id,
        messageId: a.messageId,
        fileId: a.fileId,
        fileName: a.fileName,
        fileSize: Number(a.fileSize),
        mimeType: a.mimeType,
        thumbnailUrl: a.thumbnailUrl,
        createdAt: a.createdAt,
      });
      result.set(a.messageId, list);
    }

    return result;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.attachmentRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async deleteByMessageId(messageId: string): Promise<number> {
    const result = await this.attachmentRepo.delete({ messageId });
    return result.affected ?? 0;
  }
}
