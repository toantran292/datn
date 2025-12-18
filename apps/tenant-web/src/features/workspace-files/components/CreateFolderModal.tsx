"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { FolderItem } from "../hooks/useWorkspaceFiles";

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<FolderItem | null>;
  onSuccess?: () => void;
}

export function CreateFolderModal({
  open,
  onOpenChange,
  onCreate,
  onSuccess,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast.error("Vui lòng nhập tên thư mục");
      return;
    }

    setIsCreating(true);
    try {
      const result = await onCreate(folderName.trim());
      if (result) {
        setFolderName("");
        toast.success("Đã tạo thư mục thành công");
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error("Không thể tạo thư mục");
      }
    } catch (error: any) {
      toast.error("Không thể tạo thư mục", {
        description: error.message || "Vui lòng thử lại sau",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    if (isCreating) return;
    setFolderName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isCreating && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontWeight: 600 }}>Tạo thư mục mới</DialogTitle>
          <DialogDescription>
            Tạo thư mục mới để sắp xếp các tệp của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folderName">Tên thư mục</Label>
            <Input
              id="folderName"
              placeholder="Nhập tên thư mục..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="rounded-xl"
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreate();
                }
              }}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={handleCreate}
            disabled={!folderName.trim() || isCreating}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-sm"
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <FolderPlus size={16} className="mr-2" />
                Tạo
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating}
            className="flex-1 rounded-xl"
          >
            Hủy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
