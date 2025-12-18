import { Card } from "@/components/ui/card";
import { FileText, Image, FileSpreadsheet, File, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentFile {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  uploadedBy: { id: string; name: string };
  uploadedAt: string;
  size: number;
}

interface RecentFilesProps {
  files?: RecentFile[];
  isLoading?: boolean;
  onViewAll?: () => void;
  onFileClick?: (file: RecentFile) => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
    return { icon: Image, color: "#3B82F6", bgColor: "#EEF4FF" };
  }
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
    return { icon: FileSpreadsheet, color: "#00C4AB", bgColor: "#ECFDF5" };
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
    return { icon: FileText, color: "#FF8800", bgColor: "#FFF4E6" };
  }
  return { icon: File, color: "#8B5CF6", bgColor: "#F5F3FF" };
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString();
};

export function RecentFiles({ files = [], isLoading = false, onViewAll, onFileClick }: RecentFilesProps) {
  if (isLoading) {
    return (
      <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
        <div className="mb-6">
          <h3 style={{ fontWeight: 600 }}>Tệp gần đây</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Các tệp tải lên mới nhất từ tất cả dự án
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
        <div className="mb-6">
          <h3 style={{ fontWeight: 600 }}>Tệp gần đây</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Các tệp tải lên mới nhất từ tất cả dự án
          </p>
        </div>
        <div className="py-8 text-center text-muted-foreground">
          <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Chưa có tệp nào được tải lên</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
      <div className="mb-6">
        <h3 style={{ fontWeight: 600 }}>Recent Files</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Latest uploads across all projects
        </p>
      </div>

      <div className="space-y-2">
        {files.map((file) => {
          const { icon: FileIcon, color, bgColor } = getFileIcon(file.name);

          return (
            <button
              key={file.id}
              onClick={() => onFileClick?.(file)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors text-left group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: bgColor }}
              >
                <FileIcon size={20} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontWeight: 500 }}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file.uploadedBy.name} • {formatTimeAgo(file.uploadedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs bg-muted border-border">
                  {file.projectName}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <ExternalLink size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-4 py-2 text-sm text-secondary hover:text-secondary/80 transition-colors rounded-lg hover:bg-secondary/5"
          style={{ fontWeight: 600 }}
        >
          Xem tất cả tệp
        </button>
      )}
    </Card>
  );
}
