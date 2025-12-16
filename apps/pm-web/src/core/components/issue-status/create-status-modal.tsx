"use client";

import { useState } from "react";
import { Button, Input, ModalCore, EModalWidth, EModalPosition, setToast, TOAST_TYPE } from "@uts/design-system/ui";
import { cn } from "@uts/fe-utils";

interface CreateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; color: string }) => Promise<void>;
}

const PRESET_COLORS = [
  { name: "Slate", value: "#94A3B8" },
  { name: "Gray", value: "#9CA3AF" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Lime", value: "#84CC16" },
  { name: "Green", value: "#10B981" },
  { name: "Emerald", value: "#059669" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Sky", value: "#0EA5E9" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Fuchsia", value: "#D946EF" },
  { name: "Pink", value: "#EC4899" },
  { name: "Rose", value: "#F43F5E" },
];

export const CreateStatusModal: React.FC<CreateStatusModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[7].value); // Default to Green
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setToast({ type: TOAST_TYPE.INFO, title: "Thông báo", message: "Vui lòng nhập tên trạng thái" });
      return;
    }

    if (trimmedName.length > 50) {
      setToast({ type: TOAST_TYPE.INFO, title: "Thông báo", message: "Tên trạng thái không được quá 50 ký tự" });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim() || "",
        color,
      });

      setToast({ type: TOAST_TYPE.SUCCESS, title: "Thành công", message: "Đã tạo trạng thái mới" });
      handleClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? "Không thể tạo trạng thái. Vui lòng thử lại.";
      setToast({ type: TOAST_TYPE.ERROR, title: "Lỗi", message: typeof message === "string" ? message : undefined });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[7].value);
      onClose();
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-custom-text-100">Tạo trạng thái mới</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-custom-text-300 hover:text-custom-text-100 transition-colors disabled:opacity-50"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="status-name" className="text-sm font-medium text-custom-text-200">
              Tên trạng thái <span className="text-red-500">*</span>
            </label>
            <Input
              id="status-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: In Progress, Review, Testing..."
              disabled={isSubmitting}
              maxLength={50}
              className="border-custom-border-200"
            />
            <p className="text-xs text-custom-text-300">{name.length}/50 ký tự</p>
          </div>

          {/* Description Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="status-description" className="text-sm font-medium text-custom-text-200">
              Mô tả (Tùy chọn)
            </label>
            <textarea
              id="status-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về trạng thái này..."
              disabled={isSubmitting}
              maxLength={200}
              rows={3}
              className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 focus:outline-none focus:ring-1 focus:ring-custom-primary-100 disabled:opacity-50"
            />
            <p className="text-xs text-custom-text-300">{description.length}/200 ký tự</p>
          </div>

          {/* Color Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-custom-text-200">Màu sắc</label>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="size-10 rounded-md border-2 border-custom-border-200 shadow-sm"
                style={{ backgroundColor: color }}
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3B82F6"
                disabled={isSubmitting}
                className="flex-1 border-custom-border-200 font-mono"
              />
            </div>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  disabled={isSubmitting}
                  className={cn(
                    "size-8 rounded border-2 transition-all hover:scale-110",
                    color === preset.value ? "border-custom-primary-100 ring-2 ring-custom-primary-100" : "border-transparent"
                  )}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-custom-border-200">
            <Button type="button" variant="neutral-primary" size="md" onClick={handleClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Đang tạo..." : "Tạo trạng thái"}
            </Button>
          </div>
        </form>
      </div>
    </ModalCore>
  );
};

