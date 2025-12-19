import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@uts/design-system/ui";
import { ImageIcon, Upload, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LogoUploadProps {
  logoUrl?: string;
  orgName?: string;
  isLoading: boolean;
  isSaving: boolean;
  onUpload: (file: File) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}

export function LogoUpload({
  logoUrl,
  orgName,
  isLoading,
  isSaving,
  onUpload,
  onDelete,
}: LogoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const success = await onUpload(selectedFile);
    if (success) {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleCancelPreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    const success = await onDelete();
    if (success) {
      setPreviewUrl(null);
      setSelectedFile(null);
    }
  };

  const displayUrl = previewUrl || logoUrl;

  if (isLoading) {
    return (
      <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex items-start gap-6">
          <Skeleton className="w-24 h-24 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
          <ImageIcon size={20} className="text-[#8B5CF6]" />
        </div>
        <div>
          <h3 className="font-semibold text-custom-text-100">Logo tổ chức</h3>
          <p className="text-sm text-custom-text-300">
            Tải lên logo đại diện cho tổ chức của bạn
          </p>
        </div>
      </div>

      <div className="flex items-start gap-6">
        {/* Current/Preview Logo */}
        <div className="flex-shrink-0">
          {displayUrl ? (
            <div className="relative group">
              <img
                src={displayUrl}
                alt={orgName || "Organization logo"}
                className="w-24 h-24 rounded-xl object-cover border border-custom-border-200"
              />
              {logoUrl && !previewUrl && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              )}
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleCancelPreview}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-custom-background-80 text-custom-text-200 hover:bg-custom-background-90 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 rounded-xl bg-custom-background-80 flex items-center justify-center border border-dashed border-custom-border-300">
              <ImageIcon size={32} className="text-custom-text-400" />
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${isDragging
                ? "border-[#00C4AB] bg-[#00C4AB]/5"
                : "border-custom-border-200 hover:border-custom-border-300 hover:bg-custom-background-80"
              }
            `}
          >
            <Upload size={24} className="mx-auto mb-2 text-custom-text-400" />
            <p className="text-sm text-custom-text-200 font-medium">
              {isDragging ? "Thả hình ảnh của bạn tại đây" : "Nhấp hoặc kéo để tải lên"}
            </p>
            <p className="text-xs text-custom-text-400 mt-1">
              PNG, JPG, GIF tối đa 2MB
            </p>
          </div>

          {previewUrl && selectedFile && (
            <div className="flex items-center gap-3 mt-4">
              <span className="text-sm text-custom-text-300 truncate flex-1">
                {selectedFile.name}
              </span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={isSaving}
                onClick={handleUpload}
                className="bg-[#00C4AB] hover:bg-[#00B09A]"
              >
                Tải lên
              </Button>
              <Button
                type="button"
                variant="neutral-primary"
                size="sm"
                onClick={handleCancelPreview}
                disabled={isSaving}
              >
                Hủy
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
