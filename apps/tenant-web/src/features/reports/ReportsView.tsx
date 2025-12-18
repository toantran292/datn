"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useReports } from "./hooks/useReports";
import { ReportCard } from "./components/ReportCard";
import { CreateReportModal } from "./components/CreateReportModal";
import { ReportDetailModal } from "./components/ReportDetailModal";
import type { ReportSummary, CreateReportRequest, ExportFormat } from "@/lib/api";

function ReportsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-4 border border-border shadow-md rounded-2xl bg-white">
          <div className="flex items-start gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/3 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ReportsView() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const {
    reports,
    total,
    page,
    totalPages,
    isLoading,
    error,
    refetch,
    setPage,
    createNewReport,
    deleteReport,
    retryReport,
    exportReport,
  } = useReports();

  const handleCreateReport = useCallback(
    async (data: CreateReportRequest) => {
      try {
        await createNewReport(data);
        toast.success("Đã bắt đầu tạo báo cáo", {
          description: "Báo cáo của bạn đang được tạo. Quá trình này có thể mất vài phút.",
        });
      } catch (err: any) {
        toast.error("Không thể tạo báo cáo", {
          description: err.message || "Vui lòng thử lại sau.",
        });
        throw err;
      }
    },
    [createNewReport]
  );

  const handleViewReport = useCallback((report: ReportSummary) => {
    setSelectedReportId(report.id);
    setDetailModalOpen(true);
  }, []);

  const handleExportReport = useCallback(
    async (report: ReportSummary, format: ExportFormat) => {
      try {
        await exportReport(report.id, format);
        toast.success(`Đã xuất ${format}`, {
          description: `${report.name} đã được tải xuống.`,
        });
      } catch (err: any) {
        toast.error("Xuất thất bại", {
          description: err.message || "Vui lòng thử lại sau.",
        });
      }
    },
    [exportReport]
  );

  const handleExportFromDetail = useCallback(
    async (reportId: string, format: ExportFormat) => {
      try {
        await exportReport(reportId, format);
        toast.success(`Đã xuất ${format}`);
      } catch (err: any) {
        toast.error("Xuất thất bại", {
          description: err.message || "Vui lòng thử lại sau.",
        });
      }
    },
    [exportReport]
  );

  const handleDeleteReport = useCallback(
    async (report: ReportSummary) => {
      const success = await deleteReport(report.id);
      if (success) {
        toast.success("Đã xóa báo cáo", {
          description: `${report.name} đã được xóa.`,
        });
      } else {
        toast.error("Không thể xóa báo cáo");
      }
    },
    [deleteReport]
  );

  const handleRetryReport = useCallback(
    async (report: ReportSummary) => {
      const result = await retryReport(report.id);
      if (result) {
        toast.success("Đã thử lại báo cáo", {
          description: "Báo cáo đang được tạo lại.",
        });
      } else {
        toast.error("Không thể thử lại báo cáo");
      }
    },
    [retryReport]
  );

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="mb-2" style={{ fontWeight: 600 }}>
              Báo cáo AI
            </h1>
            <p className="text-muted-foreground">
              Tạo báo cáo tự động từ các tài liệu trong workspace
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch} className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-[#00C4AB] hover:bg-[#00B09A] text-white rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo báo cáo
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Reports Grid */}
        {isLoading ? (
          <ReportsLoadingSkeleton />
        ) : reports.length > 0 ? (
          <>
            {/* Stats */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">Tổng cộng {total} báo cáo</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onView={handleViewReport}
                  onExport={handleExportReport}
                  onDelete={handleDeleteReport}
                  onRetry={handleRetryReport}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={page <= 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} />
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Trang {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
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
              <FileText size={32} className="text-muted-foreground" />
            </div>
            <h3 style={{ fontWeight: 600 }} className="mb-2">
              Chưa có báo cáo nào
            </h3>
            <p className="text-muted-foreground mb-6">
              Tạo báo cáo AI đầu tiên của bạn để bắt đầu
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-[#00C4AB] hover:bg-[#00B09A] text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo báo cáo
            </Button>
          </div>
        )}
      </div>

      {/* Create Report Modal */}
      <CreateReportModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateReport}
      />

      {/* Report Detail Modal */}
      <ReportDetailModal
        reportId={selectedReportId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onExport={handleExportFromDetail}
      />
    </>
  );
}
