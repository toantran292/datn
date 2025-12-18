'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface MeetingSummaryProps {
  meetingId: string;
  className?: string;
}

export function MeetingSummary({ meetingId, className = '' }: MeetingSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleGenerateSummary = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setSummary('');
    setIsExpanded(true);

    // Use streaming for better UX
    const url = api.getMeetingSummaryStreamUrl(meetingId);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    let accumulated = '';

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'token') {
          accumulated += data.token;
          setSummary(accumulated);
        } else if (data.type === 'done') {
          eventSource.close();
          setSummary(data.summary);
          setIsLoading(false);
        } else if (data.type === 'error') {
          eventSource.close();
          setError(data.error);
          setIsLoading(false);
        }
      } catch (e) {
        console.warn('[MeetingSummary] Parse error:', e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setError('Failed to connect to AI service');
      setIsLoading(false);
    };
  };

  // Simple markdown-like rendering for summary
  const renderSummary = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="font-semibold text-gray-900 dark:text-white mt-3 mb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <li key={i} className="ml-4 text-gray-700 dark:text-gray-300">
            {line.replace(/^[-•]\s*/, '')}
          </li>
        );
      }
      // Empty lines
      if (!line.trim()) {
        return <div key={i} className="h-2" />;
      }
      // Regular text
      return (
        <p key={i} className="text-gray-700 dark:text-gray-300">
          {line}
        </p>
      );
    });
  };

  return (
    <div className={`mt-3 ${className}`}>
      {/* Generate/Toggle button */}
      {!summary && !isLoading && (
        <button
          onClick={handleGenerateSummary}
          className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Summary</span>
        </button>
      )}

      {/* Loading state */}
      {isLoading && !summary && (
        <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating summary...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button
            onClick={handleGenerateSummary}
            className="ml-2 text-purple-600 dark:text-purple-400 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Summary content */}
      {summary && (
        <div className="border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/30 text-left hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-900 dark:text-purple-100">
                AI Summary
              </span>
              {isLoading && (
                <Loader2 className="w-3 h-3 animate-spin text-purple-600 dark:text-purple-400" />
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            )}
          </button>

          {/* Content */}
          {isExpanded && (
            <div className="p-3 bg-white dark:bg-gray-900 text-sm">
              {renderSummary(summary)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
