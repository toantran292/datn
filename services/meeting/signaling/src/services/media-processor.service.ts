import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ExtractAudioResult {
  audioPath: string;
  duration: number; // seconds
  format: string;
  sampleRate: number;
  channels: number;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}

@Injectable()
export class MediaProcessorService {
  private readonly logger = new Logger(MediaProcessorService.name);
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'meeting-media');
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Extract audio from video file using FFmpeg
   * Returns path to extracted audio file
   */
  async extractAudio(
    videoPath: string,
    options: {
      format?: 'mp3' | 'wav' | 'aac' | 'flac';
      sampleRate?: number;
      channels?: number; // 1 for mono, 2 for stereo
      bitrate?: string; // e.g., '128k', '192k'
    } = {},
  ): Promise<ExtractAudioResult> {
    const {
      format = 'mp3',
      sampleRate = 16000, // 16kHz is good for speech recognition
      channels = 1, // Mono is better for speech analysis
      bitrate = '128k',
    } = options;

    const videoFileName = path.basename(videoPath, path.extname(videoPath));
    const audioFileName = `${videoFileName}-audio-${Date.now()}.${format}`;
    const audioPath = path.join(this.tempDir, audioFileName);

    this.logger.log(`Extracting audio from ${videoPath} to ${audioPath}`);

    return new Promise((resolve, reject) => {
      const args = [
        '-i', videoPath,
        '-vn', // No video
        '-acodec', this.getAudioCodec(format),
        '-ar', sampleRate.toString(),
        '-ac', channels.toString(),
        '-ab', bitrate,
        '-y', // Overwrite output
        audioPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', async (code) => {
        if (code === 0) {
          // Get audio metadata
          const metadata = await this.getAudioMetadata(audioPath);
          this.logger.log(`Audio extracted successfully: ${audioPath}`);
          resolve({
            audioPath,
            duration: metadata.duration,
            format,
            sampleRate,
            channels,
          });
        } else {
          this.logger.error(`FFmpeg failed with code ${code}: ${stderr}`);
          reject(new Error(`FFmpeg failed: ${stderr}`));
        }
      });

      ffmpeg.on('error', (err) => {
        this.logger.error(`FFmpeg error: ${err.message}`);
        reject(err);
      });
    });
  }

  /**
   * Get video metadata using FFprobe
   */
  async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath,
      ];

      const ffprobe = spawn('ffprobe', args);
      let stdout = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(stdout);
            const videoStream = data.streams?.find((s: any) => s.codec_type === 'video');
            const format = data.format;

            resolve({
              duration: parseFloat(format?.duration || '0'),
              width: videoStream?.width || 0,
              height: videoStream?.height || 0,
              fps: this.parseFps(videoStream?.r_frame_rate || '0/1'),
              codec: videoStream?.codec_name || 'unknown',
              bitrate: parseInt(format?.bit_rate || '0', 10),
            });
          } catch (err) {
            reject(new Error('Failed to parse video metadata'));
          }
        } else {
          reject(new Error('FFprobe failed'));
        }
      });

      ffprobe.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Get audio metadata using FFprobe
   */
  async getAudioMetadata(audioPath: string): Promise<{ duration: number; sampleRate: number; channels: number }> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        audioPath,
      ];

      const ffprobe = spawn('ffprobe', args);
      let stdout = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(stdout);
            const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');
            const format = data.format;

            resolve({
              duration: parseFloat(format?.duration || '0'),
              sampleRate: parseInt(audioStream?.sample_rate || '0', 10),
              channels: audioStream?.channels || 1,
            });
          } catch (err) {
            reject(new Error('Failed to parse audio metadata'));
          }
        } else {
          reject(new Error('FFprobe failed'));
        }
      });

      ffprobe.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Convert audio to format optimized for AI analysis
   * - 16kHz sample rate (standard for speech recognition)
   * - Mono channel
   * - WAV format (uncompressed, best for analysis)
   */
  async convertForAiAnalysis(audioPath: string): Promise<string> {
    const outputFileName = `${path.basename(audioPath, path.extname(audioPath))}-ai.wav`;
    const outputPath = path.join(this.tempDir, outputFileName);

    this.logger.log(`Converting audio for AI analysis: ${audioPath} -> ${outputPath}`);

    return new Promise((resolve, reject) => {
      const args = [
        '-i', audioPath,
        '-acodec', 'pcm_s16le', // 16-bit PCM
        '-ar', '16000', // 16kHz
        '-ac', '1', // Mono
        '-y',
        outputPath,
      ];

      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          this.logger.log(`Audio converted for AI: ${outputPath}`);
          resolve(outputPath);
        } else {
          reject(new Error('FFmpeg conversion failed'));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Split audio into chunks for parallel processing
   * Useful for long recordings
   */
  async splitAudio(
    audioPath: string,
    chunkDurationSeconds: number = 300, // 5 minutes default
  ): Promise<string[]> {
    const metadata = await this.getAudioMetadata(audioPath);
    const chunks: string[] = [];
    const numChunks = Math.ceil(metadata.duration / chunkDurationSeconds);

    this.logger.log(`Splitting audio into ${numChunks} chunks`);

    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDurationSeconds;
      const chunkPath = path.join(
        this.tempDir,
        `${path.basename(audioPath, path.extname(audioPath))}-chunk${i}.wav`,
      );

      await new Promise<void>((resolve, reject) => {
        const args = [
          '-i', audioPath,
          '-ss', startTime.toString(),
          '-t', chunkDurationSeconds.toString(),
          '-acodec', 'pcm_s16le',
          '-ar', '16000',
          '-ac', '1',
          '-y',
          chunkPath,
        ];

        const ffmpeg = spawn('ffmpeg', args);

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            chunks.push(chunkPath);
            resolve();
          } else {
            reject(new Error(`Failed to create chunk ${i}`));
          }
        });

        ffmpeg.on('error', reject);
      });
    }

    return chunks;
  }

  /**
   * Clean up temporary files
   */
  async cleanup(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          this.logger.debug(`Cleaned up: ${filePath}`);
        }
      } catch (err) {
        this.logger.warn(`Failed to cleanup ${filePath}: ${err}`);
      }
    }
  }

  /**
   * Get appropriate audio codec for format
   */
  private getAudioCodec(format: string): string {
    const codecs: Record<string, string> = {
      mp3: 'libmp3lame',
      wav: 'pcm_s16le',
      aac: 'aac',
      flac: 'flac',
    };
    return codecs[format] || 'libmp3lame';
  }

  /**
   * Parse FPS from FFprobe format (e.g., "30/1" -> 30)
   */
  private parseFps(fpsStr: string): number {
    const parts = fpsStr.split('/');
    if (parts.length === 2) {
      return Math.round(parseInt(parts[0], 10) / parseInt(parts[1], 10));
    }
    return parseFloat(fpsStr) || 0;
  }
}
