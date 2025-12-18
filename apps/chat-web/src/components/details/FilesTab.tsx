import { useState, useEffect } from 'react';
import { Upload, Download, Paperclip, FileText, Image, Video, Music, Archive } from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

interface FilesTabProps {
  roomId: string;
  onLoadFiles?: () => Promise<FileItem[]>;
}

export function FilesTab({ roomId, onLoadFiles }: FilesTabProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [roomId]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      if (onLoadFiles) {
        const data = await onLoadFiles();
        setFiles(data);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={20} className="text-green-500" />;
    if (type.startsWith('video/')) return <Video size={20} className="text-purple-500" />;
    if (type.startsWith('audio/')) return <Music size={20} className="text-pink-500" />;
    if (type.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive size={20} className="text-amber-500" />;
    return <Paperclip size={20} className="text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-custom-primary-100/20 border-t-custom-primary-100 rounded-full animate-spin" />
          <p className="text-sm text-custom-text-400">Đang tải tệp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-custom-border-200 bg-custom-background-90">
        <div className="flex items-center gap-2 text-sm text-custom-text-300">
          <Paperclip size={14} />
          <span>
            {files.length} tệp đã chia sẻ
          </span>
        </div>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto vertical-scrollbar scrollbar-sm">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 mb-3 rounded-xl bg-custom-background-80 flex items-center justify-center">
              <Paperclip size={24} className="text-custom-text-300" />
            </div>
            <p className="text-sm font-medium text-custom-text-200 mb-1">Chưa có tệp nào được chia sẻ</p>
            <p className="text-xs text-custom-text-400">
              Các tệp được chia sẻ trong kênh này sẽ xuất hiện ở đây
            </p>
          </div>
        ) : (
          <div className="p-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-custom-background-80 transition-colors cursor-pointer border border-custom-border-100 mb-2"
                onClick={() => file.url && window.open(file.url, '_blank')}
              >
                {/* File Icon */}
                <div className="w-10 h-10 rounded-lg bg-custom-background-90 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-custom-text-100 truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-custom-text-400 mt-0.5">
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Download Icon */}
                <button
                  className="p-2 rounded-lg text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-90 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    file.url && window.open(file.url, '_blank');
                  }}
                  title="Tải xuống"
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Upload Button */}
      <div className="p-3 border-t border-custom-border-200">
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-custom-primary-100 text-white rounded-lg
                     text-sm font-medium hover:bg-custom-primary-200 transition-colors"
          onClick={() => alert('Upload file functionality - TODO')}
        >
          <Upload size={16} />
          Tải lên tệp
        </button>
      </div>
    </div>
  );
}
