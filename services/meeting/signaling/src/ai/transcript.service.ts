import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface SaveTranscriptDto {
  meetingId: string;
  speakerId: string;
  speakerName?: string;
  originalText: string;
  originalLang?: string;
  translatedText?: string;
  translatedLang?: string;
  startTime: Date;
  endTime?: Date;
  isFinal?: boolean;
}

export interface TranscriptEntry {
  id: string;
  meetingId: string;
  speakerId: string;
  speakerName: string | null;
  originalText: string;
  originalLang: string | null;
  translatedText: string | null;
  translatedLang: string | null;
  startTime: Date;
  endTime: Date | null;
  isFinal: boolean;
  createdAt: Date;
}

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save a transcript entry
   */
  async saveTranscript(dto: SaveTranscriptDto): Promise<TranscriptEntry> {
    try {
      const transcript = await this.prisma.transcript.create({
        data: {
          meetingId: dto.meetingId,
          speakerId: dto.speakerId,
          speakerName: dto.speakerName,
          originalText: dto.originalText,
          originalLang: dto.originalLang,
          translatedText: dto.translatedText,
          translatedLang: dto.translatedLang,
          startTime: dto.startTime,
          endTime: dto.endTime,
          isFinal: dto.isFinal ?? true,
        },
      });

      this.logger.debug(`Saved transcript for meeting ${dto.meetingId}`);
      return transcript;
    } catch (error) {
      this.logger.error(`Failed to save transcript: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save multiple transcript entries in batch
   */
  async saveTranscriptBatch(entries: SaveTranscriptDto[]): Promise<number> {
    if (entries.length === 0) return 0;

    try {
      const result = await this.prisma.transcript.createMany({
        data: entries.map((dto) => ({
          meetingId: dto.meetingId,
          speakerId: dto.speakerId,
          speakerName: dto.speakerName,
          originalText: dto.originalText,
          originalLang: dto.originalLang,
          translatedText: dto.translatedText,
          translatedLang: dto.translatedLang,
          startTime: dto.startTime,
          endTime: dto.endTime,
          isFinal: dto.isFinal ?? true,
        })),
      });

      this.logger.debug(`Saved ${result.count} transcript entries`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to save transcript batch: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get transcript for a meeting
   */
  async getTranscript(
    meetingId: string,
    options?: {
      limit?: number;
      offset?: number;
      lang?: string; // Filter by translation language
    },
  ): Promise<{ entries: TranscriptEntry[]; total: number }> {
    const where = {
      meetingId,
      isFinal: true, // Only get final entries
      ...(options?.lang && { translatedLang: options.lang }),
    };

    const [entries, total] = await Promise.all([
      this.prisma.transcript.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip: options?.offset,
        take: options?.limit,
      }),
      this.prisma.transcript.count({ where }),
    ]);

    return { entries, total };
  }

  /**
   * Get transcript as formatted text
   */
  async getTranscriptText(
    meetingId: string,
    options?: {
      useTranslation?: boolean;
      lang?: string;
    },
  ): Promise<string> {
    const { entries } = await this.getTranscript(meetingId, { lang: options?.lang });

    return entries
      .map((entry) => {
        const time = entry.startTime.toISOString().substring(11, 19);
        const speaker = entry.speakerName || entry.speakerId;
        const text =
          options?.useTranslation && entry.translatedText
            ? entry.translatedText
            : entry.originalText;
        return `[${time}] ${speaker}: ${text}`;
      })
      .join('\n');
  }

  /**
   * Delete transcript for a meeting
   */
  async deleteTranscript(meetingId: string): Promise<number> {
    const result = await this.prisma.transcript.deleteMany({
      where: { meetingId },
    });
    return result.count;
  }
}
