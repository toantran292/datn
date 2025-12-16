import { X, Loader2 } from 'lucide-react';
import { formatFileSize, getFileIcon, isImageFile } from '../../services/files';

export interface PendingFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  assetId?: string;
  fileId?: string;
}

export interface FilePreviewProps {
  files: PendingFile[];
  onRemove: (id: string) => void;
}

export function FilePreview({ files, onRemove }: FilePreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 mb-2 bg-custom-background-90 border border-custom-border-200 rounded-lg">
      {files.map((file) => (
        <div
          key={file.id}
          className="relative flex items-center gap-2 px-3 py-2 bg-custom-background-100 border border-custom-border-200 rounded-lg max-w-[200px]"
        >
          {/* Preview or icon */}
          {file.preview && isImageFile(file.file.type) ? (
            <img
              src={file.preview}
              alt={file.file.name}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <span className="text-2xl">{getFileIcon(file.file.type)}</span>
          )}

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-custom-text-100 truncate">{file.file.name}</p>
            <p className="text-xs text-custom-text-400">
              {file.status === 'uploading'
                ? `${file.progress}%`
                : file.status === 'error'
                  ? file.error || 'Error'
                  : formatFileSize(file.file.size)}
            </p>
          </div>

          {/* Status indicator */}
          {file.status === 'uploading' && (
            <Loader2 size={16} className="animate-spin text-custom-primary-100" />
          )}

          {/* Remove button */}
          <button
            onClick={() => onRemove(file.id)}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-custom-background-80 border border-custom-border-200 flex items-center justify-center text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-90"
          >
            <X size={12} />
          </button>

          {/* Progress bar */}
          {file.status === 'uploading' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-custom-background-80 rounded-b-lg overflow-hidden">
              <div
                className="h-full bg-custom-primary-100 transition-all duration-200"
                style={{ width: `${file.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Alias for backward compatibility
export { FilePreview as FilePreviewList };
