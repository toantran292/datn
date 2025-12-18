'use client';

import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface TranscriptViewerProps {
  meetingId: string;
  className?: string;
}

export function TranscriptViewer({ meetingId, className = '' }: TranscriptViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasNoTranscript, setHasNoTranscript] = useState(false);

  // Handle download as text file - only check when user clicks
  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const text = await api.getMeetingTranscriptText(meetingId);
      if (!text || text.trim() === '') {
        setHasNoTranscript(true);
        return;
      }
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${meetingId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download transcript:', err);
      setHasNoTranscript(true);
    } finally {
      setIsDownloading(false);
    }
  };

  // Hide if we already know there's no transcript
  if (hasNoTranscript) {
    return null;
  }

  return (
    <div className={`mt-3 ${className}`}>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors disabled:opacity-50"
      >
        <FileText className="w-4 h-4" />
        <span>Meeting subtitles</span>
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
