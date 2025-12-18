import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@uts/design-system/ui";
import { Button } from "@uts/design-system/ui";
import { Building2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrgSettings } from "../hooks/useOrgSettings";

interface GeneralSettingsProps {
  settings: OrgSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (data: { name?: string; description?: string }) => Promise<boolean>;
}

export function GeneralSettings({ settings, isLoading, isSaving, onSave }: GeneralSettingsProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setName(settings.name || "");
      setDescription(settings.description || "");
    }
  }, [settings]);

  useEffect(() => {
    if (settings) {
      const nameChanged = name !== (settings.name || "");
      const descChanged = description !== (settings.description || "");
      setHasChanges(nameChanged || descChanged);
    }
  }, [name, description, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    const updates: { name?: string; description?: string } = {};
    if (name !== settings?.name) updates.name = name;
    if (description !== settings?.description) updates.description = description;

    await onSave(updates);
  };

  if (isLoading) {
    return (
      <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-border shadow-md rounded-2xl bg-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center">
          <Building2 size={20} className="text-[#3B82F6]" />
        </div>
        <div>
          <h3 className="font-semibold text-custom-text-100">Cài đặt chung</h3>
          <p className="text-sm text-custom-text-300">
            Thông tin cơ bản về tổ chức của bạn
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="org-name" className="text-sm font-medium text-custom-text-200">
            Tên tổ chức
          </label>
          <Input
            id="org-name"
            type="text"
            placeholder="Nhập tên tổ chức"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputSize="md"
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="org-description" className="text-sm font-medium text-custom-text-200">
            Mô tả
          </label>
          <textarea
            id="org-description"
            placeholder="Mô tả tổ chức của bạn..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-custom-border-200 bg-custom-background-100 text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none focus:ring-2 focus:ring-[#00C4AB]/20 focus:border-[#00C4AB] resize-none transition-colors"
          />
          <p className="text-xs text-custom-text-400">
            Mô tả ngắn gọn về tổ chức của bạn. Điều này sẽ hiển thị cho tất cả thành viên.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSaving}
            disabled={!hasChanges || isSaving}
            prependIcon={<Save size={16} />}
            className="bg-[#00C4AB] hover:bg-[#00B09A]"
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Card>
  );
}
