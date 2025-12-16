import { useState, useEffect, useRef } from 'react';
import { X, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { MarkdownContent } from '../common/MarkdownContent';

export interface DocumentSummaryModalProps {
  isOpen: boolean;
  roomId: string;
  attachmentId: string;
  fileName: string;
  onClose: () => void;
}

export function DocumentSummaryModal({
  isOpen,
  roomId,
  attachmentId,
  fileName,
  onClose,
}: DocumentSummaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const abortRef = useRef<{ abort: () => void } | null>(null);

  useEffect(() => {
    if (isOpen && roomId && attachmentId) {
      startStreaming(false);
    }
    return () => {
      // Cleanup on unmount or when modal closes
      abortRef.current?.abort();
      setSummary('');
      setError(null);
      setDocumentType('');
      setIsComplete(false);
      setIsCached(false);
    };
  }, [isOpen, roomId, attachmentId]);

  const startStreaming = (regenerate: boolean = false) => {
    setLoading(true);
    setError(null);
    setSummary('');
    setIsComplete(false);
    setIsCached(false);

    abortRef.current = api.streamDocumentSummary(
      roomId,
      attachmentId,
      {
        onCached: (cachedSummary, _documentName, docType) => {
          setSummary(cachedSummary);
          setDocumentType(docType);
          setIsComplete(true);
          setIsCached(true);
          setLoading(false);
        },
        onChunk: (chunk) => {
          setSummary((prev) => prev + chunk);
          setLoading(false); // Stop showing loader once first chunk arrives
        },
        onDone: (_documentName, docType) => {
          setDocumentType(docType);
          setIsComplete(true);
          setLoading(false);
        },
        onError: (err) => {
          setError(err);
          setLoading(false);
        },
      },
      regenerate,
    );
  };

  const handleRegenerate = () => {
    startStreaming(true);
  };

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-custom-background-100 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-custom-border-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="text-custom-primary-100" size={20} />
            <div>
              <h2 className="text-lg font-semibold text-custom-text-100">Document Summary</h2>
              <p className="text-sm text-custom-text-300 truncate max-w-md">{fileName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-custom-background-80 text-custom-text-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 vertical-scrollbar scrollbar-sm">
          {loading && !summary && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-custom-primary-100" />
              <p className="mt-4 text-sm text-custom-text-300">Analyzing document...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="mt-4 text-sm text-red-500">{error}</p>
              <button
                onClick={() => startStreaming(false)}
                className="mt-4 px-4 py-2 text-sm font-medium bg-custom-primary-100 text-white rounded-lg hover:bg-custom-primary-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {summary && !error && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-custom-text-300">
                  {documentType && (
                    <span className="px-2 py-0.5 bg-custom-background-80 rounded text-xs">
                      {documentType}
                    </span>
                  )}
                  {isCached && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs">
                      Cached
                    </span>
                  )}
                  {!isComplete && (
                    <span className="flex items-center gap-1 text-custom-primary-100">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-xs">Generating...</span>
                    </span>
                  )}
                </div>
                {isComplete && (
                  <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 rounded transition-colors disabled:opacity-50"
                    title="Regenerate summary"
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Regenerate
                  </button>
                )}
              </div>
              <MarkdownContent content={summary} />
              {!isComplete && !documentType && (
                <div className="flex items-center gap-2 text-custom-primary-100">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Generating summary...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-custom-border-200 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-custom-text-200 hover:bg-custom-background-80 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
