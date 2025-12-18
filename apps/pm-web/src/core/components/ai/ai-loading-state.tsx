"use client";

import { Loader2, Sparkles } from "lucide-react";

interface AILoadingStateProps {
  message?: string;
  variant?: "inline" | "modal" | "overlay";
}

export const AILoadingState: React.FC<AILoadingStateProps> = ({
  message = "AI đang xử lý...",
  variant = "inline",
}) => {
  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 z-50 bg-custom-backdrop bg-opacity-50 flex items-center justify-center">
        <div className="bg-custom-background-100 rounded-lg p-8 shadow-xl max-w-sm mx-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="size-16 rounded-full bg-custom-primary-100/10 grid place-items-center">
                <Sparkles className="size-8 text-custom-primary-100" />
              </div>
              <Loader2 className="size-6 text-custom-primary-100 animate-spin absolute -bottom-1 -right-1" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-custom-text-100">{message}</p>
              <p className="text-sm text-custom-text-300 mt-1">
                Điều này có thể mất vài giây...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="relative mb-6">
          <div className="size-16 rounded-full bg-custom-primary-100/10 grid place-items-center">
            <Sparkles className="size-8 text-custom-primary-100 animate-pulse" />
          </div>
          <Loader2 className="size-6 text-custom-primary-100 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <p className="text-base font-medium text-custom-text-100 mb-2">{message}</p>
        <p className="text-sm text-custom-text-300 text-center max-w-md">
          AI đang phân tích và cải thiện mô tả của bạn. Điều này có thể mất 5-10 giây.
        </p>
        <div className="mt-6 flex gap-2">
          <div className="size-2 rounded-full bg-custom-primary-100 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="size-2 rounded-full bg-custom-primary-100 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="size-2 rounded-full bg-custom-primary-100 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  // inline variant
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-custom-background-90 rounded-md border border-custom-border-200">
      <Loader2 className="size-4 text-custom-primary-100 animate-spin flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-custom-text-100">{message}</p>
        <p className="text-xs text-custom-text-300 mt-0.5">
          Vui lòng chờ trong giây lát...
        </p>
      </div>
      <Sparkles className="size-4 text-custom-primary-100 animate-pulse flex-shrink-0" />
    </div>
  );
};
