import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentProcessor,
  DocumentMetadata,
  ProcessedChunk,
} from './processor.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Lazy load dependencies
let ffmpeg: any = null;
let OpenAIClass: any = null;

@Injectable()
export class VideoProcessor implements DocumentProcessor {
  private readonly logger = new Logger(VideoProcessor.name);
  private readonly supportedTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime', // .mov
    'video/x-msvideo', // .avi
    'video/x-matroska', // .mkv
    'video/mpeg',
  ];

  private readonly chunkSize = 1000;
  private readonly chunkOverlap = 200;
  private openai: any = null;

  constructor(private readonly configService: ConfigService) {}

  canProcess(mimeType: string): boolean {
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
        this.logger.warn('OpenAI not configured. Video processing disabled.');
        return [];
      }
    }

    // Initialize ffmpeg lazily
    if (!ffmpeg) {
      try {
        const ffmpegModule = await import('fluent-ffmpeg');
        ffmpeg = ffmpegModule.default;
      } catch {
        this.logger.warn('fluent-ffmpeg not installed. Video processing disabled.');
        return [];
      }
    }

    const buffer =
      typeof content === 'string' ? Buffer.from(content, 'base64') : content;

    try {
      // Extract audio from video
      const audioBuffer = await this.extractAudio(buffer, metadata.fileName);

      if (!audioBuffer || audioBuffer.length === 0) {
        this.logger.warn(`No audio extracted from: ${metadata.fileName}`);
        return [];
      }

      // Transcribe audio using Whisper API
      const transcription = await this.transcribeAudio(audioBuffer, metadata);

      if (!transcription || transcription.trim().length === 0) {
        this.logger.warn(`No transcription generated for: ${metadata.fileName}`);
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
          processorType: 'video',
          transcriptionModel: 'whisper-1',
        },
      }));
    } catch (error) {
      this.logger.error('Error processing video:', error);
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
      this.logger.error('Failed to initialize OpenAI:', error);
      return false;
    }
  }

  private async extractAudio(
    videoBuffer: Buffer,
    fileName: string,
  ): Promise<Buffer> {
    const tempDir = os.tmpdir();
    const videoPath = path.join(tempDir, `video_${Date.now()}_${fileName}`);
    const audioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);

    try {
      // Write video buffer to temp file
      fs.writeFileSync(videoPath, videoBuffer);

      // Extract audio using ffmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .noVideo()
          .audioCodec('libmp3lame')
          .audioBitrate(128)
          .audioChannels(1)
          .audioFrequency(16000)
          .output(audioPath)
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
          .run();
      });

      // Read extracted audio
      const audioBuffer = fs.readFileSync(audioPath);
      return audioBuffer;
    } finally {
      // Cleanup temp files
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }

  private async transcribeAudio(
    buffer: Buffer,
    metadata: DocumentMetadata,
  ): Promise<string> {
    // Convert Buffer to Uint8Array then to File for OpenAI API
    const uint8Array = new Uint8Array(buffer);
    const file = new File([uint8Array], 'audio.mp3', {
      type: 'audio/mpeg',
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
