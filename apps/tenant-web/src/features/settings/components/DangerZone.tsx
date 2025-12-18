import { Card } from "@/components/ui/card";
import { Button } from "@uts/design-system/ui";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface DangerZoneProps {
  isLoading: boolean;
  onDeleteClick: () => void;
}

export function DangerZone({ isLoading, onDeleteClick }: DangerZoneProps) {
  const { isOwner } = useCurrentUser();

  if (isLoading) {
    return (
      <Card className="p-6 border border-red-200 shadow-md rounded-2xl bg-red-50/30">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-red-200 shadow-md rounded-2xl bg-red-50/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-red-900">Vùng nguy hiểm</h3>
          <p className="text-sm text-red-700">
            Các hành động không thể hoàn tác và mang tính hủy diệt
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Delete Organization */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-white">
          <div>
            <p className="font-medium text-custom-text-100">Xóa tổ chức này</p>
            <p className="text-sm text-custom-text-300">
              Sau khi xóa, tất cả dữ liệu sẽ bị xóa vĩnh viễn.
            </p>
          </div>
          <Button
            variant="danger"
            size="md"
            onClick={onDeleteClick}
            disabled={!isOwner}
            prependIcon={<Trash2 size={16} />}
          >
            Xóa
          </Button>
        </div>

        {!isOwner && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertTriangle size={12} />
            Chỉ Owner của tổ chức mới có thể xóa tổ chức này.
          </p>
        )}
      </div>
    </Card>
  );
}
