/**
 * Recording API functions
 */

import { get, post, del } from './client';
import type {
  Recording,
  StartRecordingResponse,
  StopRecordingResponse,
} from './types';

export interface RecordingsListResponse {
  recordings: Recording[];
}

/**
 * Start recording for a meeting
 */
export function startRecording(
  meetingId: string,
  userId: string,
  sessionId?: string
): Promise<StartRecordingResponse> {
  return post('/recordings/start', {
    meeting_id: meetingId,
    user_id: userId,
    session_id: sessionId,
  });
}

/**
 * Stop recording
 */
export function stopRecording(
  recordingId: string,
  userId: string
): Promise<StopRecordingResponse> {
  return post(`/recordings/${recordingId}/stop`, {
    user_id: userId,
  });
}

/**
 * Get recording details
 */
export function getRecording(recordingId: string): Promise<Recording> {
  return get(`/recordings/${recordingId}`);
}

/**
 * Get all recordings for a meeting
 */
export function getMeetingRecordings(
  meetingId: string
): Promise<RecordingsListResponse> {
  return get(`/recordings/meeting/${meetingId}`);
}

/**
 * Delete recording
 */
export function deleteRecording(
  recordingId: string,
  userId: string
): Promise<{ success: boolean }> {
  return del(`/recordings/${recordingId}`, {
    user_id: userId,
  });
}
