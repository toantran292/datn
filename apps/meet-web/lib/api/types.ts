/**
 * Common API types
 */

// Meeting Types
export interface MeetingTokenRequest {
  user_id: string;
  user_name?: string;
  subject_type: 'chat' | 'project';
  chat_id?: string;
  project_id?: string;
  room_id?: string;
}

export interface MeetingTokenResponse {
  token: string;
  room_id: string;
  meeting_id: string;
  websocket_url: string;
  ice_servers: IceServer[];
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
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

export type MeetingStatus = 'WAITING' | 'ACTIVE' | 'ENDED';

export interface MeetingSession {
  meeting_id: string;
  room_id: string;
  subject_type: string;
  subject_id: string;
  status: MeetingStatus;
  started_at: string;
  ended_at?: string;
  duration?: number;
  participants: MeetingParticipant[];
  recordings: MeetingRecording[];
  is_host?: boolean;
  participants_count?: number;
  recordings_count?: number;
}

export interface MeetingSessionDetail extends MeetingSession {
  host_user_id: string;
  org_id?: string;
  locked: boolean;
  max_participants: number;
}

// Recording Types
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

// Summary Types
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

export interface ParticipantSummary {
  userId: string;
  userName: string;
  speakingTime?: number;
  contributions?: string[];
}

export interface MeetingSummary {
  summary_id: string;
  meeting_id: string;
  status: SummaryStatus;
  summary?: string;
  key_points?: string[];
  action_items?: ActionItem[];
  decisions?: Decision[];
  participants_summary?: ParticipantSummary[];
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

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
