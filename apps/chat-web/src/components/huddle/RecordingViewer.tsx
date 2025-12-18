'use client';

import { useState, useEffect } from 'react';
import { Video, Play, Download, Loader2, Clock, HardDrive } from 'lucide-react';
import { api, type MeetingRecording } from '../../services/api';

interface RecordingViewerProps {
  meetingId: string;
  className?: string;
}

// Format duration in seconds to human readable string
function formatDuration(seconds?: number): string {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

// Format file size to human readable string
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function RecordingViewer({ meetingId, className = '' }: RecordingViewerProps) {
  const [recordings, setRecordings] = useState<MeetingRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Fetch recordings on mount
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const data = await api.getMeetingRecordings(meetingId);
        // Only show completed recordings with s3Url
        const completed = data.filter(r => r.status === 'COMPLETED' && r.s3Url);
        setRecordings(completed);
      } catch (error) {
        console.error('[RecordingViewer] Failed to fetch recordings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecordings();
  }, [meetingId]);

  // Don't render if loading or no recordings
  if (isLoading) return null;
  if (recordings.length === 0) return null;

  const handlePlay = (recording: MeetingRecording) => {
    if (recording.s3Url) {
      setPlayingId(recording.recordingId);
    }
  };

  const handleDownload = (recording: MeetingRecording) => {
    if (recording.s3Url) {
      const a = document.createElement('a');
      a.href = recording.s3Url;
      a.download = `recording-${recording.recordingId}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className={`mt-3 space-y-2 ${className}`}>
      {recordings.map((recording) => (
        <div key={recording.recordingId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Video player when playing */}
          {playingId === recording.recordingId && recording.s3Url && (
            <div className="relative bg-black">
              <video
                src={recording.s3Url}
                controls
                autoPlay
                className="w-full max-h-64"
                onEnded={() => setPlayingId(null)}
              />
              <button
                onClick={() => setPlayingId(null)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded text-white hover:bg-black/70"
              >
                Close
              </button>
            </div>
          )}

          {/* Recording info and controls */}
          <div className="p-2 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Video className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Meeting recording</span>
                {recording.duration && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDuration(recording.duration)}
                  </span>
                )}
                {recording.fileSize && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <HardDrive className="w-3 h-3" />
                    {formatFileSize(recording.fileSize)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {playingId !== recording.recordingId && (
                  <button
                    onClick={() => handlePlay(recording)}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-teal-600 dark:text-teal-400"
                    title="Play recording"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDownload(recording)}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  title="Download recording"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
