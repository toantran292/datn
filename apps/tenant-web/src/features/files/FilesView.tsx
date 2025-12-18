"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Upload, Filter, Grid3x3, List, ChevronLeft, ChevronRight } from "lucide-react";
import { FileCard } from "./components/FileCard";
import { StorageSummaryWidget } from "./components/StorageSummaryWidget";
import { FileUploadModal } from "./components/FileUploadModal";
import { FilePreviewModal } from "./components/FilePreviewModal";
import { toast } from "sonner";
import { useFiles, type FileItem } from "./hooks/useFiles";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Adapter to convert API FileItem to FileCard format
interface FileCardItem {
  id: number | string;
  name: string;
  type: string;
  owner: string;
  date: string;
  size: string;
  project?: string;
  thumbnail?: string;
}

function toFileCardItem(file: FileItem): FileCardItem {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    owner: file.uploadedBy,
    date: formatTimeAgo(file.uploadedAt),
    size: file.sizeFormatted,
    project: "General",
    thumbnail: file.type === "image" ? file.url : undefined,
  };
}

function formatTimeAgo(dateString: string): string {
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
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  return `${Math.floor(diffDays / 30)} tháng trước`;
}

function FilesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-4 border border-border shadow-md rounded-2xl bg-white">
          <Skeleton className="w-full h-32 rounded-xl mb-4" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function FilesView() {
  const [selectedFile, setSelectedFile] = useState<FileCardItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const {
    files,
    total,
    page,
    totalPages,
    isLoading,
    storageUsage,
    setFilters,
    uploadFile,
    deleteFile,
    getDownloadUrl,
    refetch,
  } = useFiles();

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Debounce search - wait 500ms before triggering API call
    const timeoutId = setTimeout(() => {
      setFilters({ search: value });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [setFilters]);

  const handleTypeChange = useCallback((value: string) => {
    setTypeFilter(value);
    setFilters({ type: value });
  }, [setFilters]);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters({ page: newPage });
  }, [setFilters]);

  const handlePreview = (file: FileCardItem) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const handleDownload = async (file: FileCardItem) => {
    try {
      const url = await getDownloadUrl(file.id.toString());
      if (url) {
        window.open(url, "_blank");
        toast.success(`Đang tải ${file.name}`);
      } else {
        toast.error("Không thể lấy liên kết tải xuống");
      }
    } catch {
      toast.error("Không thể tải xuống tệp");
    }
  };

  const handleDelete = async (file: FileCardItem) => {
    const success = await deleteFile(file.id.toString());
    if (success) {
      toast.success(`Đã xóa ${file.name}`, {
        description: "Tệp đã được xóa khỏi workspace của bạn.",
      });
    } else {
      toast.error("Không thể xóa tệp");
    }
  };

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    refetch();
    toast.success("Tệp đã được tải lên thành công");
  };

  const fileCardItems = files.map(toFileCardItem);

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <h1 className="mb-2" style={{ fontWeight: 600 }}>
                Tệp & Lưu trữ
              </h1>
              <p className="text-muted-foreground">
                Quản lý các tệp đã tải lên trong workspace của bạn
              </p>
            </div>

            {/* Filters Bar */}
            <div className="mb-6 flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Tìm kiếm theo tên..."
                  className="pl-10 rounded-xl bg-white border-border h-11"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full lg:w-44 rounded-xl bg-white h-11">
                  <SelectValue placeholder="Loại tệp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="image">Hình ảnh</SelectItem>
                  <SelectItem value="document">Tài liệu</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="spreadsheet">Bảng tính</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setUploadOpen(true)}
                className="shrink-0 rounded-xl bg-[#00C4AB] hover:bg-[#00B09A] text-white h-11"
              >
                <Upload size={18} className="mr-2" />
                Tải lên
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Tổng cộng {total} tệp
              </p>
              <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-lg h-8 w-8 p-0"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 size={16} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-lg h-8 w-8 p-0"
                  onClick={() => setViewMode("list")}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>

            {/* Files Grid */}
            {isLoading ? (
              <FilesLoadingSkeleton />
            ) : fileCardItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fileCardItems.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      <ChevronLeft size={16} />
                      Trước
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Trang {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Sau
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
                  <Filter size={32} className="text-muted-foreground" />
                </div>
                <h3 style={{ fontWeight: 600 }} className="mb-2">Không tìm thấy tệp</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || typeFilter !== "all"
                    ? "Hãy điều chỉnh bộ lọc hoặc từ khóa tìm kiếm"
                    : "Tải lên tệp đầu tiên để bắt đầu"}
                </p>
                {(searchQuery || typeFilter !== "all") && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("all");
                      setFilters({ search: "", type: "all" });
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Storage Summary */}
          <div className="hidden lg:block">
            <StorageSummaryWidget
              usedBytes={storageUsage?.usedBytes}
              fileCount={storageUsage?.fileCount}
            />
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <FileUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={uploadFile}
        onSuccess={handleUploadSuccess}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={selectedFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </>
  );
}
