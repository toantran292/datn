"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import type { ReportSummary, ReportStatus, ReportType, ExportFormat } from "@/lib/api";

interface ReportCardProps {
  report: ReportSummary;
  onView: (report: ReportSummary) => void;
  onExport: (report: ReportSummary, format: ExportFormat) => void;
  onDelete: (report: ReportSummary) => void;
  onRetry?: (report: ReportSummary) => void;
}

const statusConfig: Record<ReportStatus, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "Đang chờ", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800", icon: Loader2 },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  FAILED: { label: "Thất bại", color: "bg-red-100 text-red-800", icon: XCircle },
};

const typeLabels: Record<ReportType, string> = {
  SUMMARY: "Tổng hợp",
  ANALYSIS: "Phân tích",
  EXTRACTION: "Trích xuất",
  COMPARISON: "So sánh",
  CUSTOM: "Tùy chỉnh",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReportCard({ report, onView, onExport, onDelete, onRetry }: ReportCardProps) {
  const status = statusConfig[report.status];
  const StatusIcon = status.icon;
  const isCompleted = report.status === "COMPLETED";
  const isFailed = report.status === "FAILED";
  const isProcessing = report.status === "PROCESSING" || report.status === "PENDING";

  return (
    <Card className="p-4 border border-border shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">{report.name}</h3>
            <p className="text-xs text-muted-foreground">{typeLabels[report.type]}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(report)}>
              <Eye className="mr-2 h-4 w-4" />
              Xem
            </DropdownMenuItem>
            {isCompleted && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onExport(report, "PDF")}>
                  <Download className="mr-2 h-4 w-4" />
                  Xuất PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(report, "DOCX")}>
                  <Download className="mr-2 h-4 w-4" />
                  Xuất DOCX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(report, "MARKDOWN")}>
                  <Download className="mr-2 h-4 w-4" />
                  Xuất Markdown
                </DropdownMenuItem>
              </>
            )}
            {isFailed && onRetry && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onRetry(report)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Thử lại
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(report)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary" className={`${status.color} border-0`}>
          <StatusIcon className={`w-3 h-3 mr-1 ${isProcessing ? "animate-spin" : ""}`} />
          {status.label}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {report.llmProvider}
        </Badge>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(report.createdAt)}</span>
        {report.completedAt && (
          <span className="text-green-600">Hoàn thành {formatDate(report.completedAt)}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg"
          onClick={() => onView(report)}
        >
          <Eye className="w-4 h-4 mr-1" />
          Xem
        </Button>
        {isCompleted && (
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 rounded-lg"
            onClick={() => onExport(report, "PDF")}
          >
            <Download className="w-4 h-4 mr-1" />
            Xuất
          </Button>
        )}
        {isFailed && onRetry && (
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 rounded-lg"
            onClick={() => onRetry(report)}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Thử lại
          </Button>
        )}
      </div>
    </Card>
  );
}
