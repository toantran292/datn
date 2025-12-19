import { useState } from "react";
import { ModalCore, EModalWidth, EModalPosition, Button, Input } from "@uts/design-system/ui";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { FileItem } from "../hooks/useFiles";

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, metadata?: { tags?: string[]; description?: string }) => Promise<FileItem | null>;
  onSuccess?: () => void;
}

export function FileUploadModal({ open, onOpenChange, onUpload, onSuccess }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setTags("");
    setDescription("");
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn một tệp");
      return;
    }

    setIsUploading(true);
    try {
      const metadata = {
        tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        description: description || undefined,
      };

      const result = await onUpload(selectedFile, metadata);

      if (result) {
        // Reset form
        setSelectedFile(null);
        setTags("");
        setDescription("");
        onSuccess?.();
      } else {
        toast.error("Không thể tải lên tệp");
      }
    } catch (error: any) {
      toast.error("Tải lên thất bại", {
        description: error.message || "Vui lòng thử lại sau",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ModalCore
      isOpen={open}
      handleClose={handleClose}
      width={EModalWidth.MD}
      position={EModalPosition.CENTER}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
        <div>
          <h3 className="text-lg font-semibold text-custom-text-100">
            Tải lên tệp
          </h3>
          <p className="text-sm text-custom-text-300 mt-0.5">
            Tải lên một tệp vào workspace của bạn
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={isUploading}
          className="p-1.5 rounded-md hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors disabled:opacity-50"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-5 space-y-5">
        {/* File Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-custom-text-200">
            Tệp
          </label>
          <div className="relative">
            <input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-custom-border-200 rounded-xl cursor-pointer hover:border-[#00C4AB] hover:bg-[#00C4AB]/5 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-[#00C4AB]/10 flex items-center justify-center">
                    <Upload size={24} className="text-[#00C4AB]" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-custom-text-100">{selectedFile.name}</p>
                    <p className="text-sm text-custom-text-300">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      className="text-sm text-custom-text-300 hover:text-custom-text-100 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFile(null);
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-custom-background-80 flex items-center justify-center">
                    <Upload size={24} className="text-custom-text-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-custom-text-100">Nhấp để chọn tệp</p>
                    <p className="text-sm text-custom-text-300">
                      hoặc kéo và thả
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium text-custom-text-200">
            Thẻ (tùy chọn)
          </label>
          <Input
            id="tags"
            placeholder="VD: thiết kế, đánh giá, cuối cùng"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            inputSize="md"
            className="w-full"
            disabled={isUploading}
          />
          <p className="text-xs text-custom-text-300">
            Phân tách các thẻ bằng dấu phẩy
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-custom-text-200">
            Mô tả (tùy chọn)
          </label>
          <textarea
            id="description"
            placeholder="Thêm mô tả cho tệp này..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-custom-border-200 bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-[#00C4AB] focus:border-[#00C4AB] disabled:opacity-50"
            rows={3}
            disabled={isUploading}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-custom-border-200">
        <Button
          variant="neutral-primary"
          size="md"
          onClick={handleClose}
          disabled={isUploading}
        >
          Hủy
        </Button>
        <Button
          variant="primary"
          size="md"
          loading={isUploading}
          disabled={!selectedFile || isUploading}
          prependIcon={<Upload size={16} />}
          className="bg-[#00C4AB] hover:bg-[#00B09A]"
          onClick={handleUpload}
        >
          Tải lên
        </Button>
      </div>
    </ModalCore>
  );
}
