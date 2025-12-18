"use client";

import { useState } from "react";
import { ModalCore, EModalWidth, EModalPosition, Button, Input } from "@uts/design-system/ui";
import { X, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CreateReportRequest, ReportType, LlmProvider } from "@/lib/api";

interface CreateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateReportRequest) => Promise<void>;
}

const reportTypes: { value: ReportType; label: string; description: string }[] = [
  { value: "SUMMARY", label: "Tổng hợp", description: "Tạo báo cáo tổng hợp từ các tài liệu" },
  { value: "ANALYSIS", label: "Phân tích", description: "Phân tích chi tiết nội dung tài liệu" },
  { value: "EXTRACTION", label: "Trích xuất", description: "Trích xuất thông tin cụ thể từ tài liệu" },
  { value: "COMPARISON", label: "So sánh", description: "So sánh và đối chiếu nhiều tài liệu" },
  { value: "CUSTOM", label: "Tùy chỉnh", description: "Báo cáo tùy chỉnh với prompt riêng" },
];

const llmProviders: { value: LlmProvider; label: string; models: string[] }[] = [
  { value: "OPENAI", label: "OpenAI", models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"] },
  { value: "ANTHROPIC", label: "Anthropic", models: ["claude-3-sonnet", "claude-3-haiku"] },
  { value: "GOOGLE", label: "Google", models: ["gemini-pro", "gemini-ultra"] },
];

export function CreateReportModal({ open, onOpenChange, onSubmit }: CreateReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: ReportType;
    llmProvider: LlmProvider;
    llmModel: string;
    prompt: string;
  }>({
    name: "",
    description: "",
    type: "SUMMARY",
    llmProvider: "OPENAI",
    llmModel: "gpt-4o-mini",
    prompt: "",
  });

  const selectedProvider = llmProviders.find((p) => p.value === formData.llmProvider);

  const handleClose = () => {
    onOpenChange(false);
    setFormData({
      name: "",
      description: "",
      type: "SUMMARY",
      llmProvider: "OPENAI",
      llmModel: "gpt-4o-mini",
      prompt: "",
    });
  };

  const handleProviderChange = (value: LlmProvider) => {
    const provider = llmProviders.find((p) => p.value === value);
    setFormData((prev) => ({
      ...prev,
      llmProvider: value,
      llmModel: provider?.models[0] || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        llmProvider: formData.llmProvider,
        llmModel: formData.llmModel,
        fileIds: [],
        prompt: formData.prompt || undefined,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to create report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore
      isOpen={open}
      handleClose={handleClose}
      width={EModalWidth.LG}
      position={EModalPosition.CENTER}
    >
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
          <div>
            <h3 className="text-lg font-semibold text-custom-text-100">
              Tạo báo cáo AI
            </h3>
            <p className="text-sm text-custom-text-300 mt-0.5">
              Tạo báo cáo tự động từ các tài liệu trong workspace
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
          {/* Report Name */}
          <div className="space-y-2">
            <label htmlFor="report-name" className="text-sm font-medium text-custom-text-200">
              Tên báo cáo *
            </label>
            <Input
              id="report-name"
              type="text"
              placeholder="VD: Báo cáo tổng hợp tháng 12"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              inputSize="md"
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="report-description" className="text-sm font-medium text-custom-text-200">
              Mô tả
            </label>
            <Textarea
              id="report-description"
              placeholder="Mô tả ngắn gọn về báo cáo..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full"
            />
          </div>

          {/* Report Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-custom-text-200">
              Loại báo cáo
            </label>
            <div className="grid grid-cols-2 gap-3">
              {reportTypes.slice(0, 4).map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.type === type.value
                      ? "border-custom-primary-100 bg-custom-primary-100/5"
                      : "border-custom-border-200 hover:border-custom-border-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      formData.type === type.value ? "border-custom-primary-100" : "border-custom-border-300"
                    }`}>
                      {formData.type === type.value && (
                        <div className="w-2 h-2 rounded-full bg-custom-primary-100" />
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${
                      formData.type === type.value ? "text-custom-primary-100" : "text-custom-text-100"
                    }`}>
                      {type.label}
                    </span>
                  </div>
                  <p className="text-xs text-custom-text-300 ml-6">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* LLM Provider & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-custom-text-200">
                Nhà cung cấp AI
              </label>
              <Select value={formData.llmProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {llmProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-custom-text-200">
                Mô hình
              </label>
              <Select
                value={formData.llmModel}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, llmModel: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedProvider?.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Prompt (for CUSTOM type) */}
          {formData.type === "CUSTOM" && (
            <div className="space-y-2">
              <label htmlFor="custom-prompt" className="text-sm font-medium text-custom-text-200">
                Prompt tùy chỉnh
              </label>
              <Textarea
                id="custom-prompt"
                placeholder="Nhập prompt tùy chỉnh cho AI..."
                value={formData.prompt}
                onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                rows={4}
                className="w-full"
              />
            </div>
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
            disabled={!formData.name.trim() || isSubmitting}
            prependIcon={<FileText size={16} />}
          >
            Tạo báo cáo
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
