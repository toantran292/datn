"use client";

import { AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@uts/design-system/ui";

interface AIErrorStateProps {
  error: string;
  onRetry?: () => void;
  variant?: "inline" | "modal" | "banner";
  title?: string;
  showRetry?: boolean;
}

export const AIErrorState: React.FC<AIErrorStateProps> = ({
  error,
  onRetry,
  variant = "inline",
  title,
  showRetry = true,
}) => {
  const isRateLimitError = error.includes("giới hạn") || error.includes("rate limit");
  const isNetworkError = error.includes("network") || error.includes("kết nối");

  if (variant === "modal") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="size-16 rounded-full bg-red-500/10 grid place-items-center mb-4">
          {isRateLimitError ? (
            <AlertTriangle className="size-8 text-orange-500" />
          ) : (
            <XCircle className="size-8 text-red-500" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-custom-text-100 mb-2">
          {title || "Đã xảy ra lỗi"}
        </h3>
        <p className="text-sm text-custom-text-300 mb-6 max-w-md">{error}</p>
        {showRetry && onRetry && !isRateLimitError && (
          <Button variant="primary" size="md" onClick={onRetry}>
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        )}
        {isRateLimitError && (
          <p className="text-xs text-custom-text-400 mt-4">
            Vui lòng chờ ít nhất 1 giờ trước khi thử lại
          </p>
        )}
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
        <div className="size-8 rounded-full bg-red-500/10 grid place-items-center flex-shrink-0 mt-0.5">
          {isRateLimitError ? (
            <AlertTriangle className="size-4 text-orange-500" />
          ) : (
            <XCircle className="size-4 text-red-500" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-custom-text-100 mb-1">
            {title || "Không thể xử lý yêu cầu"}
          </p>
          <p className="text-sm text-custom-text-300">{error}</p>
          {isNetworkError && (
            <p className="text-xs text-custom-text-400 mt-2">
              Kiểm tra kết nối mạng và thử lại sau vài giây.
            </p>
          )}
        </div>
        {showRetry && onRetry && !isRateLimitError && (
          <Button variant="neutral-primary" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3.5" />
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  // inline variant
  return (
    <div className="flex items-start gap-3 py-3 px-4 bg-red-500/5 rounded-md border border-red-500/20">
      {isRateLimitError ? (
        <AlertTriangle className="size-4 text-orange-500 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="size-4 text-red-500 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-custom-text-100">{title || "Lỗi"}</p>
        <p className="text-xs text-custom-text-300 mt-0.5">{error}</p>
      </div>
      {showRetry && onRetry && !isRateLimitError && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-custom-primary-100 hover:text-custom-primary-200 flex items-center gap-1 flex-shrink-0"
        >
          <RefreshCw className="size-3" />
          Thử lại
        </button>
      )}
    </div>
  );
};
