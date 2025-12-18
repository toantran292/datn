const API_URL = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600';

export interface MeetingTokenRequest {
  user_id: string;
  user_name?: string;
  subject_type: 'chat' | 'project';
  chat_id?: string;
  project_id?: string;
  room_id?: string;
  org_id?: string;
}

export interface MeetingTokenResponse {
  token: string;
  room_id: string;
  meeting_id: string;
  websocket_url: string;
  ice_servers: any[];
}

export interface MeetingParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: string;
  status?: string;
  joinedAt?: string;
  leftAt?: string;
}

export interface MeetingRecording {
  id: string;
  sessionId: string;
  status: string;
  duration?: number;
  s3Url?: string;
  startedAt?: string;
}

export interface MeetingSession {
  meeting_id: string;
  room_id: string;
  subject_type: string;
  subject_id: string;
  status: 'WAITING' | 'ACTIVE' | 'ENDED';
  started_at: string;
  ended_at?: string;
  duration?: number;
  participants: MeetingParticipant[];
  recordings: MeetingRecording[];
  is_host?: boolean;
  participants_count?: number;
  recordings_count?: number;
}

export interface GetUserSessionsResponse {
  sessions: MeetingSession[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetSessionDetailResponse {
  session: MeetingSession & {
    host_user_id: string;
    org_id?: string;
    locked: boolean;
    max_participants: number;
  } | null;
}

export async function getMeetingToken(
  params: MeetingTokenRequest
): Promise<MeetingTokenResponse> {
  const response = await fetch(`${API_URL}/meet/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get meeting token: ${error}`);
  }

  return response.json();
}

/**
 * Notify meeting service that user is leaving the meeting
 */
export async function leaveMeeting(
  meetingId: string,
  userId: string
): Promise<void> {
  try {
    await fetch(`${API_URL}/meet/${meetingId}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });
  } catch (error) {
    // Don't throw - leaving notification failure shouldn't block UI
    console.warn('Failed to notify meeting service about leave:', error);
  }
}

/**
 * Get user's meeting sessions
 */
export async function getUserSessions(
  userId: string,
  options?: {
    status?: 'WAITING' | 'ACTIVE' | 'ENDED';
    limit?: number;
    offset?: number;
  }
): Promise<GetUserSessionsResponse> {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const response = await fetch(
    `${API_URL}/sessions/users/${userId}?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user sessions: ${error}`);
  }

  return response.json();
}

/**
 * Get session details
 */
export async function getSessionDetail(
  sessionId: string
): Promise<GetSessionDetailResponse> {
  const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get session detail: ${error}`);
  }

  return response.json();
}

/**
 * Get sessions by subject (chat or project)
 */
export async function getSubjectSessions(
  subjectType: 'chat' | 'project',
  subjectId: string,
  options?: {
    status?: 'WAITING' | 'ACTIVE' | 'ENDED';
    limit?: number;
    offset?: number;
  }
): Promise<GetUserSessionsResponse> {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const response = await fetch(
    `${API_URL}/sessions/subject/${subjectType}/${subjectId}?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get subject sessions: ${error}`);
  }

  return response.json();
}

// ==================== Recording API ====================

export type RecordingStatus = 'PENDING' | 'RECORDING' | 'STOPPED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Recording {
  recording_id: string;
  session_id: string;
  meeting_id?: string;
  status: RecordingStatus;
  started_by?: string;
  stopped_by?: string;
  started_at?: string;
  stopped_at?: string;
  duration?: number;
  file_path?: string;
  file_size?: number;
  s3_url?: string;
  error?: string;
}

export interface StartRecordingResponse {
  recording_id: string;
  session_id: string;
  status: RecordingStatus;
  started_at: string;
}

export interface StopRecordingResponse {
  recording_id: string;
  status: RecordingStatus;
  duration: number;
  stopped_at: string;
}

/**
 * Start recording for a meeting
 */
export async function startRecording(
  meetingId: string,
  userId: string,
  sessionId?: string
): Promise<StartRecordingResponse> {
  const response = await fetch(`${API_URL}/recordings/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meeting_id: meetingId,
      user_id: userId,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to start recording: ${error}`);
  }

  return response.json();
}

/**
 * Stop recording
 */
export async function stopRecording(
  recordingId: string,
  userId: string
): Promise<StopRecordingResponse> {
  const response = await fetch(`${API_URL}/recordings/${recordingId}/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to stop recording: ${error}`);
  }

  return response.json();
}

/**
 * Get recording details
 */
export async function getRecording(recordingId: string): Promise<Recording> {
  const response = await fetch(`${API_URL}/recordings/${recordingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get recording: ${error}`);
  }

  return response.json();
}

/**
 * Get all recordings for a meeting
 */
export async function getMeetingRecordings(
  meetingId: string
): Promise<{ recordings: Recording[] }> {
  const response = await fetch(`${API_URL}/recordings/meeting/${meetingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get meeting recordings: ${error}`);
  }

  return response.json();
}

/**
 * Delete recording
 */
export async function deleteRecording(
  recordingId: string,
  userId: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/recordings/${recordingId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete recording: ${error}`);
  }

  return response.json();
}

// ==================== AI Summary API ====================

export type SummaryStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ActionItem {
  id: string;
  content: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface Decision {
  id: string;
  content: string;
  madeBy?: string;
  timestamp?: string;
}

export interface MeetingSummary {
  summary_id: string;
  meeting_id: string;
  status: SummaryStatus;
  summary?: string;
  key_points?: string[];
  action_items?: ActionItem[];
  decisions?: Decision[];
  participants_summary?: {
    userId: string;
    userName: string;
    speakingTime?: number;
    contributions?: string[];
  }[];
  topics_discussed?: string[];
  next_steps?: string[];
  generated_at?: string;
  error?: string;
}

export interface GenerateSummaryRequest {
  meeting_id: string;
  user_id: string;
  recording_id?: string;
  include_transcript?: boolean;
}

export interface GenerateSummaryResponse {
  summary_id: string;
  status: SummaryStatus;
  message: string;
}

/**
 * Generate AI summary for a meeting
 */
export async function generateMeetingSummary(
  params: GenerateSummaryRequest
): Promise<GenerateSummaryResponse> {
  const response = await fetch(`${API_URL}/summaries/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate summary: ${error}`);
  }

  return response.json();
}

/**
 * Get meeting summary
 */
export async function getMeetingSummary(
  meetingId: string
): Promise<{ summary: MeetingSummary | null }> {
  const response = await fetch(`${API_URL}/summaries/meeting/${meetingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get summary: ${error}`);
  }

  return response.json();
}

/**
 * Get summary by ID
 */
export async function getSummaryById(
  summaryId: string
): Promise<MeetingSummary> {
  const response = await fetch(`${API_URL}/summaries/${summaryId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get summary: ${error}`);
  }

  return response.json();
}

/**
 * Update action item status
 */
export async function updateActionItem(
  summaryId: string,
  actionItemId: string,
  completed: boolean,
  userId: string
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${API_URL}/summaries/${summaryId}/action-items/${actionItemId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        completed,
        user_id: userId,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update action item: ${error}`);
  }

  return response.json();
}

/**
 * Regenerate summary
 */
export async function regenerateSummary(
  meetingId: string,
  userId: string
): Promise<GenerateSummaryResponse> {
  const response = await fetch(`${API_URL}/summaries/regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meeting_id: meetingId,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to regenerate summary: ${error}`);
  }

  return response.json();
}
