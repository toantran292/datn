const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface AdminMeeting {
  id: string;
  roomId: string;
  subjectType: 'chat' | 'project';
  subjectId: string;
  orgId: string | null;
  hostUserId: string;
  hostName: string;
  status: 'ACTIVE' | 'ENDED' | 'WAITING' | 'TERMINATED';
  participantCount: number;
  startedAt: string;
  endedAt: string | null;
  duration: number;
  locked: boolean;
}

export interface AdminMeetingDetail extends Omit<AdminMeeting, 'hostName'> {
  maxParticipants: number | null;
  participants: {
    id: string;
    userId: string;
    userName: string | null;
    userAvatar: string | null;
    role: 'HOST' | 'MODERATOR' | 'GUEST';
    status: 'JOINED' | 'LEFT' | 'KICKED';
    joinedAt: string;
    leftAt: string | null;
    kickedBy: string | null;
    kickReason: string | null;
  }[];
  recordings: {
    id: string;
    status: string;
    startedAt: string | null;
    stoppedAt: string | null;
    duration: number | null;
    fileSize: number | null;
  }[];
  events: {
    id: string;
    eventType: string;
    userId: string | null;
    targetUserId: string | null;
    timestamp: string;
    metadata: Record<string, any> | null;
  }[];
}

export interface ListMeetingsResponse {
  meetings: AdminMeeting[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListMeetingsOptions {
  status?: 'ACTIVE' | 'ENDED' | 'WAITING';
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Admin API client for meeting management
 */
export const adminApi = {
  /**
   * List all meetings (system admin only)
   */
  async listMeetings(
    userId: string,
    options: ListMeetingsOptions = {}
  ): Promise<ListMeetingsResponse> {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());
    if (options.search) params.set('search', options.search);

    const response = await fetch(`${API_URL}/admin/meetings?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to list meetings: ${response.status}`);
    }

    return response.json();
  },

  /**
   * List active meetings only
   */
  async listActiveMeetings(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<ListMeetingsResponse> {
    return this.listMeetings(userId, { status: 'ACTIVE', limit, offset });
  },

  /**
   * Get meeting detail
   */
  async getMeetingDetail(
    userId: string,
    meetingId: string
  ): Promise<{ meeting: AdminMeetingDetail }> {
    const response = await fetch(`${API_URL}/admin/meetings/${meetingId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to get meeting detail: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Terminate (force end) a meeting
   */
  async terminateMeeting(
    userId: string,
    meetingId: string,
    reason?: string
  ): Promise<{ success: boolean; meeting_id: string; terminated_at: string }> {
    const response = await fetch(`${API_URL}/admin/meetings/${meetingId}/terminate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to terminate meeting: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Kick participant from meeting
   */
  async kickParticipant(
    userId: string,
    meetingId: string,
    targetUserId: string,
    reason?: string
  ): Promise<{ success: boolean; meeting_id: string; kicked_user_id: string }> {
    const response = await fetch(`${API_URL}/admin/meetings/${meetingId}/kick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify({ target_user_id: targetUserId, reason }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to kick participant: ${response.status}`);
    }

    return response.json();
  },
};
