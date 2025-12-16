import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentProcessor,
  DocumentMetadata,
  ProcessedChunk,
} from './processor.interface';

// Lazy load OpenAI to handle optional dependency
let OpenAIClass: any = null;

@Injectable()
export class AudioProcessor implements DocumentProcessor {
  private readonly supportedTypes = [
    'audio/mpeg', // .mp3
    'audio/mp4', // .m4a
    'audio/x-m4a', // .m4a (alternative)
    'audio/m4a', // .m4a (alternative)
    'audio/wav', // .wav
    'audio/x-wav', // .wav (alternative)
    'audio/webm', // .webm
    'audio/ogg', // .ogg
    'audio/flac', // .flac
    'audio/x-flac', // .flac (alternative)
    'audio/aac', // .aac
  ];

  private readonly chunkSize = 1000;
  private readonly chunkOverlap = 200;
  private openai: any = null;

  constructor(private readonly configService: ConfigService) {}

  canProcess(mimeType: string): boolean {
    // Accept any audio/* mime type since Whisper API supports most formats
    if (mimeType.startsWith('audio/')) {
      return true;
    }
    return this.supportedTypes.some(
      type => mimeType === type || mimeType.startsWith(type),
    );
  }

  getSupportedTypes(): string[] {
    return this.supportedTypes;
  }

  async process(
    content: Buffer | string,
    metadata: DocumentMetadata,
  ): Promise<ProcessedChunk[]> {
    // Initialize OpenAI client lazily
    if (!this.openai) {
      const initialized = await this.initializeOpenAI();
      if (!initialized) {
        console.warn('OpenAI not configured. Audio processing disabled.');
        return [];
      }
    }

    const buffer =
      typeof content === 'string' ? Buffer.from(content, 'base64') : content;

    try {
      // Transcribe audio using Whisper API
      const transcription = await this.transcribeAudio(buffer, metadata);

      if (!transcription || transcription.trim().length === 0) {
        console.warn(`No transcription generated for: ${metadata.fileName}`);
        return [];
      }

      // Clean and chunk the transcribed text
      const cleanedText = this.cleanText(transcription);
      const chunks = this.chunkText(cleanedText);

      return chunks.map((chunk, index) => ({
        content: chunk,
        chunkIndex: index,
        chunkTotal: chunks.length,
        metadata: {
          fileName: metadata.fileName,
          mimeType: metadata.mimeType,
          sourceId: metadata.sourceId,
          processorType: 'audio',
          transcriptionModel: 'whisper-1',
        },
      }));
    } catch (error) {
      console.error('Error processing audio:', error);
      return [];
    }
  }

  private async initializeOpenAI(): Promise<boolean> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      return false;
    }

    try {
      if (!OpenAIClass) {
        const openaiModule = await import('openai');
        OpenAIClass = openaiModule.default;
      }
      this.openai = new OpenAIClass({ apiKey });
      return true;
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      return false;
    }
  }

  private async transcribeAudio(
    buffer: Buffer,
    metadata: DocumentMetadata,
  ): Promise<string> {
    // Convert Buffer to Uint8Array then to File for OpenAI API
    const uint8Array = new Uint8Array(buffer);
    const file = new File([uint8Array], metadata.fileName, {
      type: metadata.mimeType,
    });

    const response = await this.openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'text',
    });

    return response;
  }

  private cleanText(text: string): string {
    return (
      text
        // Remove excessive whitespace but preserve sentence breaks
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        // Remove null characters
        .replace(/\0/g, '')
        // Trim each line
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        // Final trim
        .trim()
    );
  }

  private chunkText(text: string): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];

    let currentIndex = 0;

    while (currentIndex < text.length) {
      let endIndex = Math.min(currentIndex + this.chunkSize, text.length);

      if (endIndex < text.length) {
        for (const sep of separators) {
          const lastSepIndex = text.lastIndexOf(sep, endIndex);
          if (lastSepIndex > currentIndex + this.chunkSize / 2) {
            endIndex = lastSepIndex + sep.length;
            break;
          }
        }
      }

      const chunk = text.slice(currentIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      currentIndex = endIndex - this.chunkOverlap;
      if (currentIndex >= text.length - this.chunkOverlap) {
        break;
      }
    }

    return chunks;
  }
}
