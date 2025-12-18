import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StorageSummaryWidgetProps {
  usedBytes?: number;
  fileCount?: number;
  quotaBytes?: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatBytesToGB(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}

export function StorageSummaryWidget({
  usedBytes,
  fileCount,
  quotaBytes = 10 * 1024 * 1024 * 1024, // 10 GB default
}: StorageSummaryWidgetProps) {
  const isLoading = usedBytes === undefined;

  if (isLoading) {
    return (
      <Card className="p-6 shadow-md rounded-2xl border border-border sticky top-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="mb-6">
          <Skeleton className="h-10 w-40 mb-2" />
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3 pt-6 border-t border-border">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  const totalUsedGB = formatBytesToGB(usedBytes || 0);
  const totalQuotaGB = formatBytesToGB(quotaBytes);
  const usagePercent = quotaBytes > 0 ? ((usedBytes || 0) / quotaBytes) * 100 : 0;

  return (
    <Card className="p-6 shadow-md rounded-2xl border border-border sticky top-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#FF8800]/10 flex items-center justify-center">
          <HardDrive size={20} className="text-[#FF8800]" />
        </div>
        <h3 style={{ fontWeight: 600 }}>Tổng quan lưu trữ</h3>
      </div>

      {/* Total Storage */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span style={{ fontSize: '2rem', fontWeight: 600, color: '#FF8800' }}>
            {totalUsedGB < 0.01 ? formatBytes(usedBytes || 0) : `${totalUsedGB.toFixed(2)} GB`}
          </span>
          {totalUsedGB >= 0.01 && (
            <span className="text-muted-foreground">/ {totalQuotaGB.toFixed(0)} GB</span>
          )}
        </div>
        <Progress value={usagePercent} className="h-3 mb-2" />
        <p className="text-sm text-muted-foreground">
          Đã sử dụng {usagePercent.toFixed(1)}% hạn mức
        </p>
      </div>

      {/* File Count */}
      <div className="pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tổng số tệp</span>
          <span style={{ fontWeight: 600, fontSize: '1.25rem' }}>{fileCount || 0}</span>
        </div>

        {/* Storage Tips */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">
            {usagePercent >= 90 ? (
              <span className="text-red-500">Lưu trữ sắp đầy! Hãy xem xét xóa các tệp không sử dụng.</span>
            ) : usagePercent >= 70 ? (
              <span className="text-amber-500">Lưu trữ đang được lấp đầy. Thường xuyên xem xét các tệp của bạn.</span>
            ) : (
              "Có nhiều dung lượng lưu trữ cho workspace của bạn."
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}
