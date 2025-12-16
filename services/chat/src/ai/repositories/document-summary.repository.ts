import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentSummary } from '../../database/entities/document-summary.entity';

export interface DocumentSummaryEntity {
  id: string;
  attachmentId: string;
  roomId: string;
  fileName: string;
  mimeType: string;
  summary: string;
  transcription: string | null;
  generatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentSummaryDto {
  attachmentId: string;
  roomId: string;
  fileName: string;
  mimeType: string;
  summary: string;
  transcription?: string;
  generatedBy: string;
}

@Injectable()
export class DocumentSummaryRepository {
  private readonly logger = new Logger(DocumentSummaryRepository.name);

  constructor(
    @InjectRepository(DocumentSummary)
    private readonly repo: Repository<DocumentSummary>,
  ) {
    this.logger.log('DocumentSummaryRepository initialized');
    this.logger.debug(`Repository metadata: ${this.repo.metadata?.tableName || 'N/A'}`);
  }

  async findByAttachmentId(attachmentId: string): Promise<DocumentSummaryEntity | null> {
    this.logger.debug(`findByAttachmentId called with: ${attachmentId}`);
    try {
      const entity = await this.repo.findOne({
        where: { attachmentId },
      });

      this.logger.debug(`findByAttachmentId result: ${entity ? 'found' : 'not found'}`);
      if (!entity) return null;

      return this.toEntity(entity);
    } catch (error) {
      this.logger.error(`findByAttachmentId error: ${error}`);
      throw error;
    }
  }

  async create(dto: CreateDocumentSummaryDto): Promise<DocumentSummaryEntity> {
    const entity = this.repo.create({
      attachmentId: dto.attachmentId,
      roomId: dto.roomId,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      summary: dto.summary,
      transcription: dto.transcription || null,
      generatedBy: dto.generatedBy,
    });

    const saved = await this.repo.save(entity);
    return this.toEntity(saved);
  }

  async update(
    attachmentId: string,
    data: { summary: string; transcription?: string; generatedBy: string },
  ): Promise<DocumentSummaryEntity | null> {
    await this.repo.update(
      { attachmentId },
      {
        summary: data.summary,
        transcription: data.transcription,
        generatedBy: data.generatedBy,
      },
    );

    return this.findByAttachmentId(attachmentId);
  }

  async upsert(dto: CreateDocumentSummaryDto): Promise<DocumentSummaryEntity> {
    this.logger.debug(`upsert called for attachmentId: ${dto.attachmentId}`);
    try {
      const existing = await this.findByAttachmentId(dto.attachmentId);

      if (existing) {
        this.logger.debug(`upsert: updating existing summary`);
        const updated = await this.update(dto.attachmentId, {
          summary: dto.summary,
          transcription: dto.transcription,
          generatedBy: dto.generatedBy,
        });
        return updated!;
      }

      this.logger.debug(`upsert: creating new summary`);
      return this.create(dto);
    } catch (error) {
      this.logger.error(`upsert error: ${error}`);
      throw error;
    }
  }

  async delete(attachmentId: string): Promise<boolean> {
    const result = await this.repo.delete({ attachmentId });
    return (result.affected ?? 0) > 0;
  }

  private toEntity(entity: DocumentSummary): DocumentSummaryEntity {
    return {
      id: entity.id,
      attachmentId: entity.attachmentId,
      roomId: entity.roomId,
      fileName: entity.fileName,
      mimeType: entity.mimeType,
      summary: entity.summary,
      transcription: entity.transcription,
      generatedBy: entity.generatedBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
