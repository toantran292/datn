'use client';

import { useState, useCallback } from 'react';
import { Download, FileText, Video, Loader2, X } from 'lucide-react';
import { getTranscript } from '@/lib/translation';

interface MeetingExportsProps {
  meetingId: string | null;
  recordedBlob: Blob | null;
  isRecording: boolean;
  onDownloadRecording: () => void;
  onClose?: () => void;
}

export function MeetingExports({
  meetingId,
  recordedBlob,
  isRecording,
  onDownloadRecording,
  onClose,
}: MeetingExportsProps) {
  const [isExportingTranscript, setIsExportingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const handleExportTranscript = useCallback(async (format: 'text' | 'json') => {
    if (!meetingId) {
      setTranscriptError('No meeting ID available');
      return;
    }

    setIsExportingTranscript(true);
    setTranscriptError(null);

    try {
      if (format === 'text') {
        const result = await getTranscript(meetingId, { format: 'text' });
        if (!result?.text) {
          setTranscriptError('No transcript available');
          return;
        }

        // Download as .txt file
        const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${meetingId}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const result = await getTranscript(meetingId, { format: 'json' });
        if (!result?.entries || result.entries.length === 0) {
          setTranscriptError('No transcript available');
          return;
        }

        // Download as .json file
        const blob = new Blob([JSON.stringify(result.entries, null, 2)], {
          type: 'application/json;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${meetingId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('[MeetingExports] Failed to export transcript:', error);
      setTranscriptError('Failed to export transcript');
    } finally {
      setIsExportingTranscript(false);
    }
  }, [meetingId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="bg-ts-card-surface rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
        style={{ backgroundColor: 'var(--ts-card-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Export Meeting Data</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          {/* Recording Section */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Video Recording</h3>
                <p className="text-sm text-gray-400">Download meeting recording as .webm</p>
              </div>
            </div>
            <button
              onClick={onDownloadRecording}
              disabled={!recordedBlob || isRecording}
              className="w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <Download className="w-4 h-4" />
              {isRecording ? 'Recording in progress...' : recordedBlob ? 'Download Recording' : 'No recording available'}
            </button>
          </div>

          {/* Transcript Section */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Transcript</h3>
                <p className="text-sm text-gray-400">Download meeting captions/transcript</p>
              </div>
            </div>

            {transcriptError && (
              <p className="text-sm text-red-400 mb-3">{transcriptError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleExportTranscript('text')}
                disabled={!meetingId || isExportingTranscript}
                className="flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              >
                {isExportingTranscript ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                .txt
              </button>
              <button
                onClick={() => handleExportTranscript('json')}
                disabled={!meetingId || isExportingTranscript}
                className="flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              >
                {isExportingTranscript ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                .json
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          Transcript contains all spoken captions from the meeting
        </p>
      </div>
    </div>
  );
}
