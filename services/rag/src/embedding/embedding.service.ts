import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EmbeddingRepository, SearchOptions, SearchResult, CreateEmbeddingDto } from './embedding.repository';
import { EmbeddingSourceType } from '../database/entities/document-embedding.entity';

export interface IndexDocumentDto {
  namespaceId: string;
  namespaceType?: string;
  orgId: string;
  sourceType: EmbeddingSourceType;
  sourceId: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private embeddings: OpenAIEmbeddings;
  private readonly defaultChunkSize = 1000;
  private readonly defaultChunkOverlap = 200;

  constructor(
    private readonly configService: ConfigService,
    private readonly embeddingRepo: EmbeddingRepository,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured. Embedding service will not work.');
      return;
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: this.configService.get<string>('EMBEDDING_MODEL') || 'text-embedding-3-small',
    });

    this.logger.log('Embedding service initialized');
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    if (!this.embeddings) {
      throw new Error('Embedding service not initialized. Check OPENAI_API_KEY.');
    }
    const result = await this.embeddings.embedQuery(text);
    return result;
  }

  /**
   * Generate embeddings for multiple texts (more efficient)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.embeddings) {
      throw new Error('Embedding service not initialized. Check OPENAI_API_KEY.');
    }
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

    this.logger.debug(`Indexing ${chunks.length} chunks for ${dto.sourceType}:${dto.sourceId}`);

    // Generate embeddings for all chunks
    const embeddings = await this.embedBatch(chunks);

    // Create embedding records
    const createDtos: CreateEmbeddingDto[] = chunks.map((chunk, index) => ({
      namespaceId: dto.namespaceId,
      namespaceType: dto.namespaceType,
      orgId: dto.orgId,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
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
    if (exists) {
      this.logger.debug(`Already indexed: ${dto.sourceType}:${dto.sourceId}`);
      return;
    }

    // Generate embedding
    const embedding = await this.embed(dto.content);

    // Save
    await this.embeddingRepo.create({
      namespaceId: dto.namespaceId,
      namespaceType: dto.namespaceType,
      orgId: dto.orgId,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
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
   * Delete all embeddings for a namespace
   */
  async deleteByNamespace(namespaceId: string): Promise<number> {
    return this.embeddingRepo.deleteByNamespaceId(namespaceId);
  }

  /**
   * Get embedding stats for a namespace
   */
  async getNamespaceStats(namespaceId: string): Promise<{
    totalEmbeddings: number;
    bySourceType: Record<string, number>;
  }> {
    return this.embeddingRepo.getNamespaceStats(namespaceId);
  }

  /**
   * Chunk text using recursive character splitting
   */
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    if (!text || text.length === 0) return [];
    if (text.length <= chunkSize) return [text];

    const chunks: string[] = [];
    const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];

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

      const chunk = text.slice(currentIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
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
