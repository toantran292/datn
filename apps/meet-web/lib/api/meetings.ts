/**
 * Meeting API functions
 */

import { get, post } from './client';
import type {
  MeetingTokenRequest,
  MeetingTokenResponse,
  MeetingSession,
  MeetingSessionDetail,
  MeetingStatus,
} from './types';

export interface GetUserSessionsResponse {
  sessions: MeetingSession[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetSessionDetailResponse {
  session: MeetingSessionDetail | null;
}

/**
 * Get meeting token for joining
 */
export function getMeetingToken(
  params: MeetingTokenRequest
): Promise<MeetingTokenResponse> {
  return post('/meet/token', params);
}

/**
 * Get user's meeting sessions
 */
export function getUserSessions(
  userId: string,
  options?: {
    status?: MeetingStatus;
    limit?: number;
    offset?: number;
  }
): Promise<GetUserSessionsResponse> {
  return get(`/sessions/users/${userId}`, {
    status: options?.status,
    limit: options?.limit,
    offset: options?.offset,
  });
}

/**
 * Get session details
 */
export function getSessionDetail(
  sessionId: string
): Promise<GetSessionDetailResponse> {
  return get(`/sessions/${sessionId}`);
}

/**
 * Get sessions by subject (chat or project)
 */
export function getSubjectSessions(
  subjectType: 'chat' | 'project',
  subjectId: string,
  options?: {
    status?: MeetingStatus;
    limit?: number;
    offset?: number;
  }
): Promise<GetUserSessionsResponse> {
  return get(`/sessions/subject/${subjectType}/${subjectId}`, {
    status: options?.status,
    limit: options?.limit,
    offset: options?.offset,
  });
}
