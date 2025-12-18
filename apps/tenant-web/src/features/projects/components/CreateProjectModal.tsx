"use client";

import { useState } from "react";
import { ModalCore, EModalWidth, EModalPosition, Button, Input, TextArea } from "@uts/design-system/ui";
import { X, FolderPlus } from "lucide-react";
import type { CreateProjectData } from "../hooks/useProjects";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProjectData) => Promise<void>;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onSubmit,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setName("");
    setIdentifier("");
    setDescription("");
    setError(null);
    onOpenChange(false);
  };

  const handleIdentifierChange = (value: string) => {
    // Only allow alphanumeric, max 5 chars, uppercase
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
    setIdentifier(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Tên dự án là bắt buộc");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        identifier: identifier.trim() || undefined,
        description: description.trim() || undefined,
      });
      handleClose();
    } catch (err: any) {
      console.error("Failed to create project:", err);
      setError(err.message || "Không thể tạo dự án. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore
      isOpen={open}
      handleClose={handleClose}
      width={EModalWidth.MD}
      position={EModalPosition.CENTER}
    >
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
          <div>
            <h3 className="text-lg font-semibold text-custom-text-100">
              Tạo dự án mới
            </h3>
            <p className="text-sm text-custom-text-300 mt-0.5">
              Tạo một dự án mới để tổ chức công việc của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-5">
          {/* Project Name Field */}
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium text-custom-text-200">
              Tên dự án <span className="text-red-500">*</span>
            </label>
            <Input
              id="project-name"
              type="text"
              placeholder="VD: Chiến dịch Marketing"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              inputSize="md"
              className="w-full"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Project ID Field */}
          <div className="space-y-2">
            <label htmlFor="project-id" className="text-sm font-medium text-custom-text-200">
              Mã dự án
            </label>
            <Input
              id="project-id"
              type="text"
              placeholder="Tự động tạo nếu để trống"
              value={identifier}
              onChange={(e) => handleIdentifierChange(e.target.value)}
              inputSize="md"
              className="w-full"
              disabled={isSubmitting}
              maxLength={5}
            />
            <p className="text-xs text-custom-text-300">
              Tối đa 5 ký tự. Để trống để tự động tạo từ tên dự án.
            </p>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label htmlFor="project-description" className="text-sm font-medium text-custom-text-200">
              Mô tả
            </label>
            <TextArea
              id="project-description"
              placeholder="Mô tả dự án..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px]"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-custom-border-200">
          <Button
            variant="neutral-primary"
            size="md"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            disabled={!name.trim() || isSubmitting}
            prependIcon={<FolderPlus size={16} />}
            className="bg-[#00C4AB] hover:bg-[#00B09A]"
          >
            Tạo dự án
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
