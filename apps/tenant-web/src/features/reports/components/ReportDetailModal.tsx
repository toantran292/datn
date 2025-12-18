"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Cpu,
  Calendar,
  AlertCircle,
} from "lucide-react";
import type { Report, ReportStatus, ExportFormat } from "@/lib/api";
import { useReportDetail } from "../hooks/useReports";
import ReactMarkdown from "react-markdown";

interface ReportDetailModalProps {
  reportId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (reportId: string, format: ExportFormat) => void;
}

const statusConfig: Record<ReportStatus, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "Đang chờ", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800", icon: Loader2 },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  FAILED: { label: "Thất bại", color: "bg-red-100 text-red-800", icon: XCircle },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReportDetailModal({ reportId, open, onOpenChange, onExport }: ReportDetailModalProps) {
  const { report, isLoading, error } = useReportDetail(reportId);

  if (!reportId) return null;

  const status = report ? statusConfig[report.status] : null;
  const StatusIcon = status?.icon || Clock;
  const isCompleted = report?.status === "COMPLETED";
  const isProcessing = report?.status === "PROCESSING" || report?.status === "PENDING";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {report?.name || "Chi tiết báo cáo"}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12 text-destructive">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {report && !isLoading && (
          <>
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {status && (
                <Badge variant="secondary" className={`${status.color} border-0`}>
                  <StatusIcon className={`w-3 h-3 mr-1 ${isProcessing ? "animate-spin" : ""}`} />
                  {status.label}
                </Badge>
              )}
              <Badge variant="outline">{report.type}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {report.llmProvider} / {report.llmModel}
              </Badge>
            </div>

            {/* Description */}
            {report.description && (
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
            )}

            {/* Timestamps */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Tạo lúc: {formatDate(report.createdAt)}
              </div>
              {report.completedAt && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  Hoàn thành: {formatDate(report.completedAt)}
                </div>
              )}
            </div>

            {/* Token Usage */}
            {report.tokenUsage && (
              <div className="flex gap-4 text-xs bg-muted p-3 rounded-lg mb-4">
                <div>
                  <span className="text-muted-foreground">Đầu vào:</span>{" "}
                  <span className="font-medium">{report.tokenUsage.input.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Đầu ra:</span>{" "}
                  <span className="font-medium">{report.tokenUsage.output.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tổng:</span>{" "}
                  <span className="font-medium">{report.tokenUsage.total.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {report.errorMessage && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {report.errorMessage}
              </div>
            )}

            <Separator />

            {/* Content */}
            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-medium">Đang tạo báo cáo...</p>
                <p className="text-sm">Quá trình này có thể mất vài phút</p>
              </div>
            )}

            {isCompleted && report.content && (
              <ScrollArea className="flex-1 min-h-[300px] max-h-[400px]">
                <div className="prose prose-sm max-w-none p-4">
                  <ReactMarkdown>{report.content}</ReactMarkdown>
                </div>
              </ScrollArea>
            )}

            {/* Export Actions */}
            {isCompleted && (
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => onExport(report.id, "PDF")}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất PDF
                </Button>
                <Button variant="outline" onClick={() => onExport(report.id, "DOCX")}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất DOCX
                </Button>
                <Button variant="outline" onClick={() => onExport(report.id, "MARKDOWN")}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất Markdown
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
