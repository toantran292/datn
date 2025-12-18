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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Search,
  Upload,
  FolderPlus,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Home,
  Filter,
} from "lucide-react";
import { FolderCard } from "./components/FolderCard";
import { WorkspaceFileCard } from "./components/WorkspaceFileCard";
import { CreateFolderModal } from "./components/CreateFolderModal";
import { FileUploadModal } from "@/features/files/components/FileUploadModal";
import { FilePreviewModal } from "@/features/files/components/FilePreviewModal";
import { toast } from "sonner";
import {
  useWorkspaceFiles,
  type FileItem,
  type FolderItem,
} from "./hooks/useWorkspaceFiles";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkspaceFilesViewProps {
  workspaceId: string;
  userRole?: "OWNER" | "ADMIN" | "MEMBER";
}

function FilesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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

export function WorkspaceFilesView({ workspaceId, userRole = "MEMBER" }: WorkspaceFilesViewProps) {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "file" | "folder"; item: any } | null>(
    null
  );

  const canDelete = userRole === "OWNER" || userRole === "ADMIN";

  const {
    files,
    folders,
    breadcrumb,
    total,
    page,
    totalPages,
    isLoading,
    currentFolderId,
    setFilters,
    navigateToFolder,
    createFolder,
    deleteFolder,
    deleteFile,
    getDownloadUrl,
    getPresignedUploadUrl,
    refetch,
  } = useWorkspaceFiles(workspaceId);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      const timeoutId = setTimeout(() => {
        setFilters({ search: value });
      }, 500);
      return () => clearTimeout(timeoutId);
    },
    [setFilters]
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      setTypeFilter(value);
      setFilters({ type: value });
    },
    [setFilters]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setFilters({ page: newPage });
    },
    [setFilters]
  );

  const handleFolderOpen = (folder: FolderItem) => {
    navigateToFolder(folder.id);
    setSearchQuery("");
    setTypeFilter("all");
  };

  const handleBreadcrumbClick = (folderId: string | null) => {
    navigateToFolder(folderId);
    setSearchQuery("");
    setTypeFilter("all");
  };

  const handlePreview = (file: FileItem) => {
    setSelectedFile({
      id: file.id,
      name: file.name,
      type: file.type,
      owner: file.uploadedBy?.name || "Unknown",
      date: new Date(file.createdAt).toLocaleDateString(),
      size: file.sizeFormatted,
    });
    setPreviewOpen(true);
  };

  const handleDownload = async (file: FileItem | any) => {
    try {
      const url = await getDownloadUrl(file.id);
      if (url) {
        window.open(url, "_blank");
        toast.success(`Đang tải xuống ${file.name}`);
      } else {
        toast.error("Không thể lấy liên kết tải xuống");
      }
    } catch {
      toast.error("Không thể tải xuống tệp");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "file") {
      const success = await deleteFile(itemToDelete.item.id);
      if (success) {
        toast.success(`Đã xóa ${itemToDelete.item.name}`);
      } else {
        toast.error("Không thể xóa tệp");
      }
    } else {
      const success = await deleteFolder(itemToDelete.item.id);
      if (success) {
        toast.success(`Đã xóa thư mục "${itemToDelete.item.name}"`);
      } else {
        toast.error("Không thể xóa thư mục");
      }
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteFile = (file: FileItem) => {
    setItemToDelete({ type: "file", item: file });
    setDeleteDialogOpen(true);
  };

  const handleDeleteFolder = (folder: FolderItem) => {
    setItemToDelete({ type: "folder", item: folder });
    setDeleteDialogOpen(true);
  };

  const handleUpload = async (
    file: File,
    metadata?: { tags?: string[]; description?: string }
  ) => {
    try {
      const result = await getPresignedUploadUrl({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      });

      if (!result) {
        throw new Error("Failed to get upload URL");
      }

      // Upload to presigned URL
      const uploadResponse = await fetch(result.presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      await refetch();
      return { id: result.assetId } as any;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    toast.success("Đã tải lên tệp thành công");
  };

  const handleCreateFolderSuccess = () => {
    setCreateFolderOpen(false);
  };

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2" style={{ fontWeight: 600 }}>
            Tệp Workspace
          </h1>
          <p className="text-muted-foreground">
            Quản lý tệp và thư mục trong workspace của bạn
          </p>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumb.map((item, index) => (
                <BreadcrumbItem key={item.id ?? "root"}>
                  {index < breadcrumb.length - 1 ? (
                    <>
                      <BreadcrumbLink
                        className="cursor-pointer hover:text-secondary flex items-center gap-1"
                        onClick={() => handleBreadcrumbClick(item.id)}
                      >
                        {index === 0 && <Home size={14} />}
                        {item.name}
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  ) : (
                    <BreadcrumbPage className="flex items-center gap-1">
                      {index === 0 && <Home size={14} />}
                      {item.name}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
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
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="image">Hình ảnh</SelectItem>
              <SelectItem value="document">Tài liệu</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="spreadsheet">Bảng tính</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setCreateFolderOpen(true)}
            variant="outline"
            className="rounded-xl h-11"
          >
            <FolderPlus size={18} className="mr-2" />
            Thư mục mới
          </Button>

          <Button
            onClick={() => setUploadOpen(true)}
            className="bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-sm h-11"
          >
            <Upload size={18} className="mr-2" />
            Tải lên
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {folders.length} thư mục, {total} tệp
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

        {/* Files & Folders Grid */}
        {isLoading ? (
          <FilesLoadingSkeleton />
        ) : folders.length > 0 || files.length > 0 ? (
          <>
            {/* Folders Section */}
            {folders.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Thư mục</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onOpen={handleFolderOpen}
                      onDelete={handleDeleteFolder}
                      canDelete={canDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Files Section */}
            {files.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Tệp</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {files.map((file) => (
                    <WorkspaceFileCard
                      key={file.id}
                      file={file}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                      onDelete={handleDeleteFile}
                      canDelete={canDelete}
                    />
                  ))}
                </div>
              </div>
            )}

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
            <h3 style={{ fontWeight: 600 }} className="mb-2">
              {searchQuery || typeFilter !== "all" ? "Không tìm thấy tệp" : "Thư mục này trống"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || typeFilter !== "all"
                ? "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm"
                : "Tải lên tệp hoặc tạo thư mục để bắt đầu"}
            </p>
            {searchQuery || typeFilter !== "all" ? (
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
            ) : (
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setCreateFolderOpen(true)}
                >
                  <FolderPlus size={16} className="mr-2" />
                  Thư mục mới
                </Button>
                <Button
                  className="bg-secondary hover:bg-secondary/90 text-white rounded-xl"
                  onClick={() => setUploadOpen(true)}
                >
                  <Upload size={16} className="mr-2" />
                  Tải lên tệp
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={createFolder}
        onSuccess={handleCreateFolderSuccess}
      />

      {/* Upload Modal */}
      <FileUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleUpload}
        onSuccess={handleUploadSuccess}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={selectedFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onDownload={handleDownload}
        onDelete={canDelete ? handleDeleteFile : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xóa {itemToDelete?.type === "folder" ? "thư mục" : "tệp"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa "{itemToDelete?.item?.name}"?
              {itemToDelete?.type === "folder" &&
                " Điều này cũng sẽ xóa tất cả các tệp trong thư mục này."}
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
              onClick={handleDeleteConfirm}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
