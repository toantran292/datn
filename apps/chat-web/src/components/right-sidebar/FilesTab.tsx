import { useState, useEffect } from 'react';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Only reload when roomId changes, not when onLoadFiles changes

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

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📎';
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
        Loading files...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f9f9f9' }}>
        <div style={{ fontSize: '13px', color: '#666' }}>
          {files.length} {files.length === 1 ? 'file' : 'files'} shared
        </div>
      </div>

      {/* Files List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {files.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#999',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '48px' }}>📎</div>
            <div style={{ fontSize: '14px' }}>No files shared yet</div>
            <div style={{ fontSize: '12px', color: '#bbb' }}>
              Files shared in this room will appear here
            </div>
          </div>
        ) : (
          <div style={{ padding: '8px' }}>
            {files.map((file) => (
              <div
                key={file.id}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  border: '1px solid #e0e0e0',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => file.url && window.open(file.url, '_blank')}
              >
                {/* File Icon */}
                <div style={{ fontSize: '28px', flexShrink: 0 }}>
                  {getFileIcon(file.type)}
                </div>

                {/* File Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Download Icon */}
                <div style={{ fontSize: '18px', color: '#666', flexShrink: 0 }}>
                  ⬇️
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Upload Button */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
        <button
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onClick={() => alert('Upload file functionality - TODO')}
        >
          <span>📤</span>
          <span>Upload File</span>
        </button>
      </div>
    </div>
  );
}

