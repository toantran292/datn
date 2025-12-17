import { useState, useCallback, useRef, useEffect } from 'react';

export interface ClientRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  recordedBlob: Blob | null;
  isUploading: boolean;
  uploadProgress: number;
}

interface UseClientRecordingOptions {
  meetingId: string | null;
  userId: string | null;
  onRecordingComplete?: (blob: Blob, duration: number) => void;
}

/**
 * Hook for client-side recording using MediaRecorder API
 * Records the current tab (meeting screen) + microphone audio
 */
export function useClientRecording({
  meetingId,
  userId,
  onRecordingComplete,
}: UseClientRecordingOptions) {
  const [state, setState] = useState<ClientRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
    recordedBlob: null,
    isUploading: false,
    uploadProgress: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  /**
   * Get screen capture stream (preferring current tab)
   */
  const getScreenCaptureStream = useCallback(async (): Promise<MediaStream> => {
    try {
      // Request screen capture with preferCurrentTab to auto-select current tab
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true, // Capture tab audio
        // @ts-ignore - preferCurrentTab is a newer API
        preferCurrentTab: true,
        // @ts-ignore - selfBrowserSurface hints to show current tab first
        selfBrowserSurface: 'include',
      });

      // Also get microphone audio to mix in
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        // Add mic audio track to the stream
        micStream.getAudioTracks().forEach((track) => {
          screenStream.addTrack(track);
        });
      } catch (micErr) {
        console.warn('[ClientRecording] Could not get mic audio:', micErr);
      }

      // Handle when user stops sharing
      screenStream.getVideoTracks()[0].onended = () => {
        console.log('[ClientRecording] Screen share stopped by user');
        stopRecording();
      };

      return screenStream;
    } catch (err: any) {
      console.error('[ClientRecording] Failed to get screen capture:', err);
      throw new Error(
        err.name === 'NotAllowedError'
          ? 'Screen sharing permission denied'
          : 'Failed to capture screen'
      );
    }
  }, []);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    if (state.isRecording) {
      setState((prev) => ({ ...prev, error: 'Recording already in progress' }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, error: null }));

      // Get screen capture stream (will prefer current tab)
      const stream = await getScreenCaptureStream();
      streamRef.current = stream;

      // Determine best supported MIME type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'audio/webm', // Fallback for audio-only
      ];

      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      if (!mimeType) {
        throw new Error('No supported recording format found');
      }

      console.log('[ClientRecording] Using MIME type:', mimeType);

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          recordedBlob: blob,
        }));

        // Cleanup cloned stream (don't stop original tracks)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Callback
        if (onRecordingComplete) {
          onRecordingComplete(blob, duration);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('[ClientRecording] MediaRecorder error:', event.error);
        setState((prev) => ({
          ...prev,
          error: 'Recording error: ' + event.error?.message,
          isRecording: false,
        }));
      };

      // Start recording
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        recordedBlob: null,
        error: null,
      }));

      console.log('[ClientRecording] Recording started');

    } catch (err: any) {
      console.error('[ClientRecording] Failed to start recording:', err);
      setState((prev) => ({
        ...prev,
        error: err.message || 'Failed to start recording',
        isRecording: false,
      }));
    }
  }, [state.isRecording, getScreenCaptureStream, onRecordingComplete]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Don't stop the cloned stream here - it will be stopped in onstop handler
  }, []);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, []);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, []);

  /**
   * Toggle recording
   */
  const toggleRecording = useCallback(async () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  /**
   * Upload recording to server
   */
  const uploadRecording = useCallback(
    async (blob?: Blob): Promise<string | null> => {
      const recordingBlob = blob || state.recordedBlob;

      if (!recordingBlob) {
        setState((prev) => ({ ...prev, error: 'No recording to upload' }));
        return null;
      }

      if (!meetingId || !userId) {
        setState((prev) => ({ ...prev, error: 'Missing meeting or user ID' }));
        return null;
      }

      setState((prev) => ({ ...prev, isUploading: true, uploadProgress: 0, error: null }));

      try {
        const formData = new FormData();
        formData.append('file', recordingBlob, `recording-${meetingId}-${Date.now()}.webm`);
        formData.append('meeting_id', meetingId);
        formData.append('user_id', userId);
        formData.append('duration', String(state.duration));

        const API_URL = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600';

        const response = await fetch(`${API_URL}/recordings/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Upload failed');
        }

        const result = await response.json();

        setState((prev) => ({
          ...prev,
          isUploading: false,
          uploadProgress: 100,
        }));

        return result.url || result.s3_url;
      } catch (err: any) {
        console.error('[ClientRecording] Upload failed:', err);
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: err.message || 'Upload failed',
        }));
        return null;
      }
    },
    [state.recordedBlob, state.duration, meetingId, userId]
  );

  /**
   * Download recording locally
   */
  const downloadRecording = useCallback(
    (filename?: string) => {
      if (!state.recordedBlob) {
        setState((prev) => ({ ...prev, error: 'No recording to download' }));
        return;
      }

      const url = URL.createObjectURL(state.recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `meeting-recording-${meetingId || 'unknown'}-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [state.recordedBlob, meetingId]
  );

  /**
   * Clear recorded blob
   */
  const clearRecording = useCallback(() => {
    setState((prev) => ({ ...prev, recordedBlob: null, duration: 0 }));
    chunksRef.current = [];
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    toggleRecording,
    uploadRecording,
    downloadRecording,
    clearRecording,
    clearError,
    isSupported: typeof MediaRecorder !== 'undefined',
  };
}

/**
 * Format duration as MM:SS or HH:MM:SS
 */
export function formatRecordingDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
