import { useState, useCallback, useEffect, useRef } from 'react';
import {
  startRecording as apiStartRecording,
  stopRecording as apiStopRecording,
  getRecording as apiGetRecording,
  type RecordingStatus,
} from '@/lib/api';

export interface RecordingState {
  isRecording: boolean;
  recordingId: string | null;
  status: RecordingStatus | null;
  duration: number;
  startedAt: Date | null;
  error: string | null;
}

interface UseRecordingOptions {
  meetingId: string | null;
  userId: string | null;
  isJoined: boolean;
}

/**
 * Hook to manage meeting recording
 */
export function useRecording({ meetingId, userId, isJoined }: UseRecordingOptions) {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    recordingId: null,
    status: null,
    duration: 0,
    startedAt: null,
    error: null,
  });

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update duration every second when recording
  useEffect(() => {
    if (state.isRecording && state.startedAt) {
      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - (prev.startedAt?.getTime() || Date.now())) / 1000),
        }));
      }, 1000);

      return () => {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
      };
    }
  }, [state.isRecording, state.startedAt]);

  // Poll recording status when recording is active
  useEffect(() => {
    if (state.recordingId && (state.status === 'PENDING' || state.status === 'RECORDING')) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const recording = await apiGetRecording(state.recordingId!);
          setState(prev => ({
            ...prev,
            status: recording.status,
            // If recording stopped externally, update state
            isRecording: recording.status === 'RECORDING' || recording.status === 'PENDING',
          }));
        } catch (err) {
          console.error('[Recording] Failed to poll recording status:', err);
        }
      }, 5000); // Poll every 5 seconds

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [state.recordingId, state.status]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!meetingId || !userId || !isJoined) {
      setState(prev => ({ ...prev, error: 'Cannot start recording: not in meeting' }));
      return;
    }

    if (state.isRecording) {
      setState(prev => ({ ...prev, error: 'Recording already in progress' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      const response = await apiStartRecording(meetingId, userId);

      setState({
        isRecording: true,
        recordingId: response.recording_id,
        status: response.status,
        duration: 0,
        startedAt: new Date(response.started_at),
        error: null,
      });

    } catch (err: any) {
      console.error('[Recording] Failed to start recording:', err);
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to start recording',
      }));
    }
  }, [meetingId, userId, isJoined, state.isRecording]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!state.recordingId || !userId) {
      setState(prev => ({ ...prev, error: 'No active recording to stop' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      const response = await apiStopRecording(state.recordingId, userId);

      setState(prev => ({
        ...prev,
        isRecording: false,
        status: response.status,
        duration: response.duration,
        error: null,
      }));

    } catch (err: any) {
      console.error('[Recording] Failed to stop recording:', err);
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to stop recording',
      }));
    }
  }, [state.recordingId, userId]);

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    if (state.isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount or when leaving meeting
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Reset state when leaving meeting
  useEffect(() => {
    if (!isJoined) {
      setState({
        isRecording: false,
        recordingId: null,
        status: null,
        duration: 0,
        startedAt: null,
        error: null,
      });
    }
  }, [isJoined]);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleRecording,
    clearError,
  };
}

/**
 * Format duration as MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
