/**
 * AI Summary API functions
 */

import { get, post, put } from './client';
import type {
  MeetingSummary,
  GenerateSummaryRequest,
  GenerateSummaryResponse,
} from './types';

export interface GetSummaryResponse {
  summary: MeetingSummary | null;
}

/**
 * Generate AI summary for a meeting
 */
export function generateMeetingSummary(
  params: GenerateSummaryRequest
): Promise<GenerateSummaryResponse> {
  return post('/summaries/generate', params);
}

/**
 * Get meeting summary
 */
export function getMeetingSummary(
  meetingId: string
): Promise<GetSummaryResponse> {
  return get(`/summaries/meeting/${meetingId}`);
}

/**
 * Get summary by ID
 */
export function getSummaryById(summaryId: string): Promise<MeetingSummary> {
  return get(`/summaries/${summaryId}`);
}

/**
 * Update action item status
 */
export function updateActionItem(
  summaryId: string,
  actionItemId: string,
  completed: boolean,
  userId: string
): Promise<{ success: boolean }> {
  return put(`/summaries/${summaryId}/action-items/${actionItemId}`, {
    completed,
    user_id: userId,
  });
}

/**
 * Regenerate summary
 */
export function regenerateSummary(
  meetingId: string,
  userId: string
): Promise<GenerateSummaryResponse> {
  return post('/summaries/regenerate', {
    meeting_id: meetingId,
    user_id: userId,
  });
}
