import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, ZoomIn, FileText, Maximize2 } from 'lucide-react';
import type { Attachment } from '../../types';
import { formatFileSize, getFileIcon, isImageFile } from '../../services/files';

// Check if file is a PDF
function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
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

export interface FileAttachmentProps {
  attachment: Attachment;
  compact?: boolean; // Use compact layout when multiple files
}

export function FileAttachment({ attachment, compact }: FileAttachmentProps) {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const isImage = isImageFile(attachment.mimeType);
  const isPdf = isPdfFile(attachment.mimeType);
  const downloadUrl = attachment.downloadUrl;

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
      </>
    );
  }

  // Other file types - compact card
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 bg-custom-background-90 border border-custom-border-200 rounded-lg hover:bg-custom-background-80 transition-colors ${compact ? "w-[200px]" : "max-w-[280px]"}`}>
      <span className="flex-shrink-0">{getFileIcon(attachment.mimeType)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-custom-text-100 truncate">{attachment.fileName}</p>
        <p className="text-[10px] text-custom-text-400">{formatFileSize(attachment.fileSize)}</p>
      </div>
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
  );
}

export interface AttachmentListProps {
  attachments: Attachment[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  const isMultiple = attachments.length > 1;

  // For multiple attachments, use grid layout
  if (isMultiple) {
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <FileAttachment key={attachment.id} attachment={attachment} compact />
        ))}
      </div>
    );
  }

  // Single attachment - full size
  return (
    <div className="mt-2">
      <FileAttachment attachment={attachments[0]} />
    </div>
  );
}
