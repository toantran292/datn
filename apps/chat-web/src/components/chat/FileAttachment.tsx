import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, ZoomIn, FileText, Maximize2, Sparkles, Music, Play, Pause } from 'lucide-react';
import type { Attachment } from '../../types';
import { formatFileSize, getFileIcon, isImageFile } from '../../services/files';
import { DocumentSummaryModal } from '../modals/DocumentSummaryModal';

// Check if file is a PDF
function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

// Check if file is audio
function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

// Check if file can be summarized (documents that AI can read)
function canSummarize(mimeType: string): boolean {
  const summarizableTypes = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  // Audio files can be transcribed
  if (mimeType.startsWith('audio/')) {
    return true;
  }
  return summarizableTypes.includes(mimeType);
}

// Image Preview Modal - renders via Portal to ensure proper z-index
function ImagePreviewModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
      >
        <X size={24} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-lg">
        <span className="text-white text-sm">{alt}</span>
      </div>
    </div>,
    document.body
  );
}

// PDF Preview Modal - renders via Portal to ensure proper z-index
function PdfPreviewModal({
  src,
  fileName,
  onClose,
}: {
  src: string;
  fileName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[90vh] bg-custom-background-100 rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-custom-background-90 border-b border-custom-border-200">
          <div className="flex items-center gap-3">
            <FileText className="text-red-500" size={20} />
            <span className="text-sm font-medium text-custom-text-100 truncate max-w-md">{fileName}</span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors"
              title="Open in new tab"
            >
              <Download size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <iframe
          src={src}
          title={fileName}
          className="w-full h-[calc(100%-52px)] bg-white"
        />
      </div>
    </div>,
    document.body
  );
}

// Audio Player component
function AudioPlayer({
  src,
  fileName,
  fileSize,
  compact,
  roomId,
  attachmentId,
  onSummarize,
}: {
  src: string;
  fileName: string;
  fileSize: number;
  compact?: boolean;
  roomId?: string;
  attachmentId?: string;
  onSummarize?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const canTranscribe = !!roomId && !!attachmentId;

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-custom-background-90 border border-custom-border-200 rounded-lg overflow-hidden ${compact ? 'w-[200px]' : 'w-[280px]'}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="p-3">
        {/* Header with icon and file info */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Music className="text-purple-500" size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-custom-text-100 truncate" title={fileName}>
              {fileName}
            </p>
            <p className="text-[10px] text-custom-text-400">{formatFileSize(fileSize)}</p>
          </div>
        </div>

        {/* Player controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-custom-primary-100 hover:bg-custom-primary-200 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            {isPlaying ? (
              <Pause className="text-white" size={14} />
            ) : (
              <Play className="text-white ml-0.5" size={14} />
            )}
          </button>

          <div className="flex-1 flex flex-col gap-1">
            {/* Progress bar */}
            <div className="relative h-1 bg-custom-background-80 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-custom-primary-100 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            {/* Time display */}
            <div className="flex justify-between text-[10px] text-custom-text-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {canTranscribe && (
            <button
              onClick={onSummarize}
              className="p-1.5 rounded hover:bg-custom-background-80 text-custom-text-400 hover:text-custom-primary-100 transition-colors flex-shrink-0"
              title="Transcribe with AI"
            >
              <Sparkles size={14} />
            </button>
          )}
          <a
            href={src}
            download={fileName}
            className="p-1.5 rounded hover:bg-custom-background-80 text-custom-text-400 hover:text-custom-text-100 transition-colors flex-shrink-0"
            title="Download"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

export interface FileAttachmentProps {
  attachment: Attachment;
  compact?: boolean; // Use compact layout when multiple files
  roomId?: string; // Required for AI features like summarize
}

export function FileAttachment({ attachment, compact, roomId }: FileAttachmentProps) {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const isImage = isImageFile(attachment.mimeType);
  const isPdf = isPdfFile(attachment.mimeType);
  const isAudio = isAudioFile(attachment.mimeType);
  const downloadUrl = attachment.downloadUrl;
  const showSummarize = roomId && canSummarize(attachment.mimeType);

  // Audio attachment - inline player
  if (isAudio && downloadUrl) {
    return (
      <>
        <AudioPlayer
          src={downloadUrl}
          fileName={attachment.fileName}
          fileSize={attachment.fileSize}
          compact={compact}
          roomId={roomId}
          attachmentId={attachment.id}
          onSummarize={() => setShowSummaryModal(true)}
        />
        {showSummaryModal && roomId && (
          <DocumentSummaryModal
            isOpen={showSummaryModal}
            roomId={roomId}
            attachmentId={attachment.id}
            fileName={attachment.fileName}
            onClose={() => setShowSummaryModal(false)}
          />
        )}
      </>
    );
  }

  // Image attachment - inline preview with click to expand
  if (isImage && (attachment.thumbnailUrl || attachment.downloadUrl)) {
    return (
      <>
        <div className={compact ? "w-[200px]" : "max-w-[300px]"}>
          <button
            onClick={() => setShowImagePreview(true)}
            className="block w-full rounded-lg overflow-hidden border border-custom-border-200 hover:border-custom-primary-100 transition-colors cursor-zoom-in group relative"
          >
            <img
              src={attachment.thumbnailUrl || attachment.downloadUrl}
              alt={attachment.fileName}
              className={`w-full object-cover bg-custom-background-80 ${compact ? "h-[140px]" : "max-h-[200px]"}`}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" size={24} />
            </div>
          </button>
          <div className="flex items-center gap-1.5 mt-1 px-0.5">
            <span className="text-[11px] text-custom-text-400 truncate flex-1">{attachment.fileName}</span>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={attachment.fileName}
                className="text-[11px] text-custom-text-400 hover:text-custom-primary-100 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
                title="Download"
              >
                <Download size={12} />
              </a>
            )}
          </div>
        </div>

        {showImagePreview && downloadUrl && (
          <ImagePreviewModal
            src={downloadUrl}
            alt={attachment.fileName}
            onClose={() => setShowImagePreview(false)}
          />
        )}
      </>
    );
  }

  // PDF attachment - inline preview with iframe
  if (isPdf && downloadUrl) {
    return (
      <>
        <div className={compact ? "w-[200px]" : "w-[280px]"}>
          <div className="rounded-lg overflow-hidden border border-custom-border-200 bg-white">
            {/* Inline PDF preview */}
            <div className={`relative ${compact ? "h-[160px]" : "h-[200px]"}`}>
              <iframe
                src={`${downloadUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                title={attachment.fileName}
                className="w-full h-full pointer-events-none"
              />
              {/* Overlay to make clickable */}
              <button
                onClick={() => setShowPdfPreview(true)}
                className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center group"
              >
                <div className="p-2 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="text-white" size={20} />
                </div>
              </button>
            </div>
            {/* Footer */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-custom-background-90 border-t border-custom-border-200">
              <FileText className="text-red-500 flex-shrink-0" size={16} />
              <span className="text-[11px] text-custom-text-200 truncate flex-1" title={attachment.fileName}>
                {attachment.fileName}
              </span>
              {showSummarize && (
                <button
                  onClick={() => setShowSummaryModal(true)}
                  className="p-1 rounded hover:bg-custom-background-80 text-custom-text-400 hover:text-custom-primary-100 transition-colors flex-shrink-0"
                  title="Summarize with AI"
                >
                  <Sparkles size={14} />
                </button>
              )}
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-custom-background-80 text-custom-text-400 hover:text-custom-text-100 transition-colors flex-shrink-0"
                title="Download"
              >
                <Download size={14} />
              </a>
            </div>
          </div>
        </div>

        {showPdfPreview && (
          <PdfPreviewModal
            src={downloadUrl}
            fileName={attachment.fileName}
            onClose={() => setShowPdfPreview(false)}
          />
        )}

        {showSummaryModal && roomId && (
          <DocumentSummaryModal
            isOpen={showSummaryModal}
            roomId={roomId}
            attachmentId={attachment.id}
            fileName={attachment.fileName}
            onClose={() => setShowSummaryModal(false)}
          />
        )}
      </>
    );
  }

  // Other file types - compact card
  return (
    <>
      <div className={`inline-flex items-center gap-2 px-3 py-2 bg-custom-background-90 border border-custom-border-200 rounded-lg hover:bg-custom-background-80 transition-colors ${compact ? "w-[200px]" : "max-w-[280px]"}`}>
        <span className="flex-shrink-0">{getFileIcon(attachment.mimeType)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-custom-text-100 truncate">{attachment.fileName}</p>
          <p className="text-[10px] text-custom-text-400">{formatFileSize(attachment.fileSize)}</p>
        </div>
        {showSummarize && (
          <button
            onClick={() => setShowSummaryModal(true)}
            className="p-1.5 rounded hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-primary-100 transition-colors flex-shrink-0"
            title="Summarize with AI"
          >
            <Sparkles size={14} />
          </button>
        )}
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors flex-shrink-0"
            title="Download"
          >
            <Download size={14} />
          </a>
        )}
      </div>

      {showSummaryModal && roomId && (
        <DocumentSummaryModal
          isOpen={showSummaryModal}
          roomId={roomId}
          attachmentId={attachment.id}
          fileName={attachment.fileName}
          onClose={() => setShowSummaryModal(false)}
        />
      )}
    </>
  );
}

export interface AttachmentListProps {
  attachments: Attachment[];
  roomId?: string; // Required for AI features like summarize
}

export function AttachmentList({ attachments, roomId }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  const isMultiple = attachments.length > 1;

  // For multiple attachments, use grid layout
  if (isMultiple) {
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <FileAttachment key={attachment.id} attachment={attachment} compact roomId={roomId} />
        ))}
      </div>
    );
  }

  // Single attachment - full size
  return (
    <div className="mt-2">
      <FileAttachment attachment={attachments[0]} roomId={roomId} />
    </div>
  );
}
