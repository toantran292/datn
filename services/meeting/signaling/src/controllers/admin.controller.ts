import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { SystemAdminGuard } from '../guards/system-admin.guard';
import { MeetingService } from '../services/meeting.service';

@Controller('admin/meetings')
@UseGuards(SystemAdminGuard)
export class AdminMeetingController {
  private readonly logger = new Logger(AdminMeetingController.name);

  constructor(private readonly meetingService: MeetingService) {}

  /**
   * List all meetings (cross-org)
   * GET /admin/meetings
   */
  @Get()
  async listMeetings(
    @Headers('x-user-id') adminUserId: string,
    @Query('status') status?: 'ACTIVE' | 'ENDED' | 'WAITING',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
  ) {
    this.logger.log(`Admin ${adminUserId} listing meetings with status=${status}`);

    const result = await this.meetingService.getAllMeetingsForAdmin({
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
      search,
    });

    return result;
  }

  /**
   * List active meetings only
   * GET /admin/meetings/active
   */
  @Get('active')
  async listActiveMeetings(
    @Headers('x-user-id') adminUserId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log(`Admin ${adminUserId} listing active meetings`);

    return this.meetingService.getAllMeetingsForAdmin({
      status: 'ACTIVE',
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /**
   * Get meeting details with participants
   * GET /admin/meetings/:meetingId
   */
  @Get(':meetingId')
  async getMeetingDetail(
    @Headers('x-user-id') adminUserId: string,
    @Param('meetingId') meetingId: string,
  ) {
    this.logger.log(`Admin ${adminUserId} getting details for meeting ${meetingId}`);

    const meeting = await this.meetingService.getMeetingDetailForAdmin(meetingId);

    return { meeting };
  }

  /**
   * Terminate (force end) a meeting
   * POST /admin/meetings/:meetingId/terminate
   */
  @Post(':meetingId/terminate')
  async terminateMeeting(
    @Headers('x-user-id') adminUserId: string,
    @Param('meetingId') meetingId: string,
    @Body('reason') reason?: string,
  ) {
    this.logger.log(`Admin ${adminUserId} terminating meeting ${meetingId}, reason: ${reason}`);

    const result = await this.meetingService.terminateMeetingAsAdmin(
      meetingId,
      adminUserId,
      reason,
    );

    return {
      success: true,
      meeting_id: meetingId,
      terminated_at: result.endedAt,
    };
  }

  /**
   * Kick a participant from meeting
   * POST /admin/meetings/:meetingId/kick
   */
  @Post(':meetingId/kick')
  async kickParticipant(
    @Headers('x-user-id') adminUserId: string,
    @Param('meetingId') meetingId: string,
    @Body('target_user_id') targetUserId: string,
    @Body('reason') reason?: string,
  ) {
    this.logger.log(
      `Admin ${adminUserId} kicking user ${targetUserId} from meeting ${meetingId}, reason: ${reason}`,
    );

    await this.meetingService.kickParticipantAsAdmin(
      meetingId,
      targetUserId,
      adminUserId,
      reason,
    );

    return {
      success: true,
      meeting_id: meetingId,
      kicked_user_id: targetUserId,
    };
  }
}
