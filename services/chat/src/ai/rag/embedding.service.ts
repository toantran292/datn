import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingRepository, SearchOptions, SearchResult, CreateEmbeddingDto } from './embedding.repository';
import { EmbeddingSourceType } from '../../database/entities/document-embedding.entity';

export interface IndexDocumentDto {
  sourceType: EmbeddingSourceType;
  sourceId: string;
  roomId: string;
  orgId: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private embeddings: OpenAIEmbeddings;
  private readonly defaultChunkSize = 1000;
  private readonly defaultChunkOverlap = 200;

  constructor(
    private readonly configService: ConfigService,
    private readonly embeddingRepo: EmbeddingRepository,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: this.configService.get<string>('EMBEDDING_MODEL') || 'text-embedding-3-small',
    });
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    const result = await this.embeddings.embedQuery(text);
    return result;
  }

  /**
   * Generate embeddings for multiple texts (more efficient)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const results = await this.embeddings.embedDocuments(texts);
    return results;
  }

  /**
   * Index a document by chunking and embedding
   */
  async indexDocument(
    dto: IndexDocumentDto,
    options?: ChunkOptions,
  ): Promise<{ chunksCreated: number }> {
    // Delete existing embeddings for this source
    await this.embeddingRepo.deleteBySourceId(dto.sourceType, dto.sourceId);

    // Chunk the content
    const chunks = this.chunkText(
      dto.content,
      options?.chunkSize ?? this.defaultChunkSize,
      options?.chunkOverlap ?? this.defaultChunkOverlap,
    );

    if (chunks.length === 0) {
      return { chunksCreated: 0 };
    }

    // Generate embeddings for all chunks
    const embeddings = await this.embedBatch(chunks);

    // Create embedding records
    const createDtos: CreateEmbeddingDto[] = chunks.map((chunk, index) => ({
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      roomId: dto.roomId,
      orgId: dto.orgId,
      content: chunk,
      chunkIndex: index,
      chunkTotal: chunks.length,
      embedding: embeddings[index],
      metadata: {
        ...dto.metadata,
        chunkIndex: index,
        chunkTotal: chunks.length,
      },
    }));

    await this.embeddingRepo.createBatch(createDtos);

    return { chunksCreated: chunks.length };
  }

  /**
   * Index a short text (like a message) without chunking
   */
  async indexShortText(dto: IndexDocumentDto): Promise<void> {
    // Check if already indexed
    const exists = await this.embeddingRepo.existsForSource(dto.sourceType, dto.sourceId);
    if (exists) return;

    // Generate embedding
    const embedding = await this.embed(dto.content);

    // Save
    await this.embeddingRepo.create({
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      roomId: dto.roomId,
      orgId: dto.orgId,
      content: dto.content,
      chunkIndex: 0,
      chunkTotal: 1,
      embedding,
      metadata: dto.metadata,
    });
  }

  /**
   * Semantic search for similar content
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.embed(query);

    // Search for similar documents
    return this.embeddingRepo.searchSimilar(queryEmbedding, options);
  }

  /**
   * Delete embeddings for a source
   */
  async deleteBySource(sourceType: EmbeddingSourceType, sourceId: string): Promise<number> {
    return this.embeddingRepo.deleteBySourceId(sourceType, sourceId);
  }

  /**
   * Delete all embeddings for a room
   */
  async deleteByRoom(roomId: string): Promise<number> {
    return this.embeddingRepo.deleteByRoomId(roomId);
  }

  /**
   * Get embedding stats for a room
   */
  async getRoomStats(roomId: string): Promise<{ totalEmbeddings: number }> {
    const count = await this.embeddingRepo.countByRoom(roomId);
    return { totalEmbeddings: count };
  }

  /**
   * Chunk text using recursive character splitting
   */
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    if (!text || text.length === 0) return [];
    if (text.length <= chunkSize) return [text];

    const chunks: string[] = [];
    const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];

    let currentChunk = '';
    let currentIndex = 0;

    while (currentIndex < text.length) {
      // Find the best split point
      let endIndex = Math.min(currentIndex + chunkSize, text.length);

      if (endIndex < text.length) {
        // Try to find a natural break point
        let foundSeparator = false;
        for (const sep of separators) {
          const lastSepIndex = text.lastIndexOf(sep, endIndex);
          if (lastSepIndex > currentIndex + chunkSize / 2) {
            endIndex = lastSepIndex + sep.length;
            foundSeparator = true;
            break;
          }
        }

        // If no separator found, just use the chunk size
        if (!foundSeparator) {
          endIndex = Math.min(currentIndex + chunkSize, text.length);
        }
      }

      currentChunk = text.slice(currentIndex, endIndex).trim();
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      // Move to next chunk with overlap
      currentIndex = endIndex - overlap;
      if (currentIndex >= text.length - overlap) {
        break;
      }
    }

    return chunks;
  }
}
