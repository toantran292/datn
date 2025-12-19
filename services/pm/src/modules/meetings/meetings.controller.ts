import {
  Controller,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/interfaces';
import { MeetingsService } from './meetings.service';
import {
  AnalyzeMeetingDto,
  AnalyzeMeetingResponseDto,
  BulkCreateTasksDto,
  BulkCreateTasksResponseDto,
} from './dto';

@ApiTags('Meetings')
@ApiBearerAuth()
@Controller('api/meetings')
export class MeetingsController {
  private readonly logger = new Logger(MeetingsController.name);

  constructor(private readonly meetingsService: MeetingsService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze meeting and extract tasks' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Video or audio file (optional)',
        },
        projectId: {
          type: 'string',
          format: 'uuid',
          description: 'Project ID',
        },
        orgId: {
          type: 'string',
          description: 'Organization ID',
        },
        title: {
          type: 'string',
          description: 'Meeting title (optional)',
        },
        transcript: {
          type: 'string',
          description: 'Meeting transcript text (optional, if not uploading file)',
        },
      },
      required: ['projectId', 'orgId'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-matroska',
          'video/webm',
          'audio/mpeg',
          'audio/wav',
          'audio/x-m4a',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              'Invalid file type. Supported: MP4, MOV, AVI, MKV, WebM, MP3, WAV, M4A',
            ),
            false,
          );
        }
      },
    }),
  )
  async analyzeMeeting(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: AnalyzeMeetingDto,
    @Req() request: RequestWithOrg,
  ): Promise<AnalyzeMeetingResponseDto> {
    this.logger.log(`Analyzing meeting for project: ${dto.projectId}`);

    const userId = request.userId || (request.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000000';
    const orgId = dto.orgId || request.orgId;

    return this.meetingsService.analyzeMeeting(dto, file || null, orgId, userId);
  }

  @Post(':meetingId/create-tasks')
  @ApiOperation({ summary: 'Bulk create tasks from meeting' })
  async createTasks(
    @Param('meetingId') meetingId: string,
    @Body() dto: BulkCreateTasksDto,
    @Req() request: RequestWithOrg,
  ): Promise<BulkCreateTasksResponseDto> {
    this.logger.log(`Creating tasks from meeting: ${meetingId}`);

    const userId = request.userId || (request.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000000';
    const orgId = request.orgId;

    return this.meetingsService.bulkCreateTasks(meetingId, dto, orgId, userId);
  }
}
