import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private defaultBucket: string;

  constructor(private configService: ConfigService) {
    const endPoint = this.configService.get<string>('minio.endPoint');
    const port = this.configService.get<number>('minio.port');
    const useSSL = this.configService.get<boolean>('minio.useSSL');
    const accessKey = this.configService.get<string>('minio.accessKey');
    const secretKey = this.configService.get<string>('minio.secretKey');
    this.defaultBucket = this.configService.get<string>('minio.defaultBucket');

    this.minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    this.logger.log(
      `MinIO client initialized: ${endPoint}:${port} (SSL: ${useSSL})`,
    );
  }

  async onModuleInit() {
    await this.ensureBucketExists(this.defaultBucket);
  }

  async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucketName);

      if (!exists) {
        await this.minioClient.makeBucket(
          bucketName,
          this.configService.get<string>('minio.region'),
        );
        this.logger.log(`Bucket "${bucketName}" created successfully`);

        // Set bucket policy to allow public read (optional)
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };

        await this.minioClient.setBucketPolicy(
          bucketName,
          JSON.stringify(policy),
        );
        this.logger.log(`Bucket policy set for "${bucketName}"`);
      } else {
        this.logger.log(`Bucket "${bucketName}" already exists`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to ensure bucket "${bucketName}" exists: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    bucketName?: string,
  ): Promise<{
    bucket: string;
    objectKey: string;
    etag: string;
  }> {
    const bucket = bucketName || this.defaultBucket;
    const objectKey = this.generateObjectKey(file.originalname);

    try {
      const result = await this.minioClient.putObject(
        bucket,
        objectKey,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'X-Original-Name': encodeURIComponent(file.originalname),
        },
      );

      this.logger.log(`File uploaded: ${bucket}/${objectKey}`);

      return {
        bucket,
        objectKey,
        etag: result.etag,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFileUrl(
    objectKey: string,
    bucketName?: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    const bucket = bucketName || this.defaultBucket;

    try {
      const url = await this.minioClient.presignedGetObject(
        bucket,
        objectKey,
        expirySeconds,
      );
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate URL for ${objectKey}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getPresignedPutUrl(
    objectKey: string,
    bucketName?: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    const bucket = bucketName || this.defaultBucket;

    try {
      // Ensure bucket exists
      await this.ensureBucketExists(bucket);

      const url = await this.minioClient.presignedPutObject(
        bucket,
        objectKey,
        expirySeconds,
      );

      this.logger.log(
        `Presigned PUT URL generated for ${bucket}/${objectKey} (expires in ${expirySeconds}s)`,
      );

      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned PUT URL for ${objectKey}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async downloadFile(
    objectKey: string,
    bucketName?: string,
  ): Promise<Buffer> {
    const bucket = bucketName || this.defaultBucket;

    try {
      const stream = await this.minioClient.getObject(bucket, objectKey);

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(
        `Failed to download file ${objectKey}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteFile(objectKey: string, bucketName?: string): Promise<void> {
    const bucket = bucketName || this.defaultBucket;

    try {
      await this.minioClient.removeObject(bucket, objectKey);
      this.logger.log(`File deleted: ${bucket}/${objectKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file ${objectKey}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getFileStats(
    objectKey: string,
    bucketName?: string,
  ): Promise<Minio.BucketItemStat> {
    const bucket = bucketName || this.defaultBucket;

    try {
      return await this.minioClient.statObject(bucket, objectKey);
    } catch (error) {
      this.logger.error(
        `Failed to get file stats for ${objectKey}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private generateObjectKey(originalName: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const ext = originalName.split('.').pop();
    return `${timestamp}-${uuid}.${ext}`;
  }
}
