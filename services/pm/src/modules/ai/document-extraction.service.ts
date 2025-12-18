import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import { FileStorageClient } from '../../common/file-storage/file-storage.client';
import { OpenAIService } from './openai.service';

export interface ExtractedText {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount?: number;
    charCount?: number;
    mimeType: string;
  };
}

@Injectable()
export class DocumentExtractionService {
  private readonly logger = new Logger(DocumentExtractionService.name);

  constructor(
    private readonly fileStorageClient: FileStorageClient,
    private readonly openaiService: OpenAIService,
  ) {}

  /**
   * Extract text from document based on MIME type
   */
  async extractTextFromDocument(assetId: string): Promise<ExtractedText> {
    this.logger.log(`Extracting text from document: ${assetId}`);

    try {
      // Get document metadata
      const asset = await this.fileStorageClient.getFile(assetId);

      if (!asset) {
        throw new BadRequestException(`Asset not found: ${assetId}`);
      }

      // Get presigned download URL
      const urlResponse = await this.fileStorageClient.getPresignedGetUrl(assetId);

      // Download file buffer
      const response = await fetch(urlResponse.presignedUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Extract text based on MIME type
      let extractedText: ExtractedText;

      switch (asset.mimeType) {
        case 'application/pdf':
          extractedText = await this.extractFromPDF(buffer);
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // .docx
        case 'application/msword': // .doc
          extractedText = await this.extractFromWord(buffer);
          break;

        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': // .xlsx
        case 'application/vnd.ms-excel': // .xls
          extractedText = await this.extractFromExcel(buffer);
          break;

        case 'video/mp4': // .mp4
        case 'video/quicktime': // .mov
        case 'video/x-msvideo': // .avi
        case 'video/x-matroska': // .mkv
        case 'video/webm': // .webm
          extractedText = await this.extractFromVideo(buffer, asset.mimeType, asset.originalName);
          break;

        default:
          throw new BadRequestException(
            `Unsupported file type: ${asset.mimeType}`
          );
      }

      this.logger.log(
        `Successfully extracted ${extractedText.metadata.charCount} characters from ${asset.mimeType}`
      );

      return extractedText;
    } catch (error) {
      this.logger.error(`Error extracting text from document: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractFromPDF(buffer: Buffer): Promise<ExtractedText> {
    try {
      const data = await pdfParse(buffer);

      const text = data.text.trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      return {
        text,
        metadata: {
          pageCount: data.numpages,
          wordCount,
          charCount: text.length,
          mimeType: 'application/pdf',
        },
      };
    } catch (error) {
      this.logger.error('PDF extraction error:', error);
      throw new BadRequestException('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from Word document (.doc, .docx)
   */
  private async extractFromWord(buffer: Buffer): Promise<ExtractedText> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      return {
        text,
        metadata: {
          wordCount,
          charCount: text.length,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      };
    } catch (error) {
      this.logger.error('Word extraction error:', error);
      throw new BadRequestException('Failed to extract text from Word document');
    }
  }

  /**
   * Extract text from Excel (.xls, .xlsx)
   */
  private async extractFromExcel(buffer: Buffer): Promise<ExtractedText> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      let allText = '';

      // Process each sheet
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Convert to text
        jsonData.forEach((row: any[]) => {
          const rowText = row
            .filter((cell) => cell !== null && cell !== undefined)
            .join('\t');
          if (rowText) {
            allText += rowText + '\n';
          }
        });

        allText += '\n'; // Separate sheets
      });

      const text = allText.trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      return {
        text,
        metadata: {
          wordCount,
          charCount: text.length,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
    } catch (error) {
      this.logger.error('Excel extraction error:', error);
      throw new BadRequestException('Failed to extract text from Excel file');
    }
  }

  /**
   * Extract audio from video and convert to MP3
   * This reduces file size significantly while preserving audio quality
   */
  private async extractAudioFromVideo(videoBuffer: Buffer, originalName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const tempDir = os.tmpdir();
      const videoPath = path.join(tempDir, `video-${Date.now()}-${originalName}`);
      const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);

      // Write video buffer to temp file
      fs.writeFileSync(videoPath, videoBuffer);

      this.logger.log(`Extracting audio from video: ${videoPath}`);

      ffmpeg(videoPath)
        .noVideo() // Remove video stream
        .audioCodec('libmp3lame') // Use MP3 codec
        .audioBitrate('64k') // Low bitrate for small size (good for speech)
        .audioChannels(1) // Mono audio (sufficient for speech)
        .audioFrequency(16000) // 16kHz sampling rate (Whisper optimal)
        .on('end', () => {
          this.logger.log(`Audio extraction completed: ${audioPath}`);

          // Read audio file
          const audioBuffer = fs.readFileSync(audioPath);

          // Cleanup temp files
          fs.unlinkSync(videoPath);
          fs.unlinkSync(audioPath);

          resolve(audioBuffer);
        })
        .on('error', (err) => {
          this.logger.error('FFmpeg error:', err);

          // Cleanup temp files
          if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

          reject(err);
        })
        .save(audioPath);
    });
  }

  /**
   * Extract text from video using OpenAI Whisper API
   */
  private async extractFromVideo(buffer: Buffer, mimeType: string, originalName: string): Promise<ExtractedText> {
    try {
      this.logger.log(`Starting video transcription for: ${originalName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

      // Extract audio from video to reduce file size
      const audioBuffer = await this.extractAudioFromVideo(buffer, originalName);
      const audioSizeMB = audioBuffer.length / 1024 / 1024;

      this.logger.log(`Audio extracted: ${audioSizeMB.toFixed(2)} MB`);

      // Check if audio is still too large for Whisper (25MB limit)
      if (audioSizeMB > 25) {
        throw new Error(`Audio file too large: ${audioSizeMB.toFixed(2)} MB (max 25 MB)`);
      }

      // Call OpenAI Whisper API for transcription with MP3 audio
      const audioFilename = originalName.replace(/\.(mp4|mov|avi|mkv|webm)$/i, '.mp3');
      const transcription = await this.openaiService.transcribeAudio(audioBuffer, audioFilename);

      this.logger.log(`Video transcription completed: ${transcription.length} characters`);

      const wordCount = transcription.split(/\s+/).filter(Boolean).length;

      return {
        text: transcription,
        metadata: {
          wordCount,
          charCount: transcription.length,
          mimeType,
        },
      };
    } catch (error) {
      this.logger.error('Video extraction error:', error);

      // Fallback message if transcription fails
      const fallbackMessage = `[Video file: ${originalName}]\n\nKhông thể transcribe video. Lỗi: ${error.message}`;

      return {
        text: fallbackMessage,
        metadata: {
          wordCount: fallbackMessage.split(/\s+/).filter(Boolean).length,
          charCount: fallbackMessage.length,
          mimeType,
        },
      };
    }
  }
}
