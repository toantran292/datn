"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useOrgSettings } from "./hooks/useOrgSettings";
import { GeneralSettings } from "./components/GeneralSettings";
import { LogoUpload } from "./components/LogoUpload";
import { DangerZone } from "./components/DangerZone";
import { DeleteOrgModal } from "./components/DeleteOrgModal";

export function SettingsView() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    uploadLogo,
    deleteLogo,
    deleteOrganization,
  } = useOrgSettings();

  const handleSaveSettings = async (data: { name?: string; description?: string }) => {
    const success = await updateSettings(data);
    if (success) {
      toast.success("Đã lưu cài đặt", {
        description: "Cài đặt tổ chức của bạn đã được cập nhật.",
      });
    } else {
      toast.error("Không thể lưu cài đặt", {
        description: "Vui lòng thử lại sau.",
      });
    }
    return success;
  };

  const handleUploadLogo = async (file: File) => {
    const success = await uploadLogo(file);
    if (success) {
      toast.success("Đã tải lên logo", {
        description: "Logo tổ chức của bạn đã được cập nhật.",
      });
    } else {
      toast.error("Không thể tải lên logo", {
        description: "Vui lòng thử lại sau.",
      });
    }
    return success;
  };

  const handleDeleteLogo = async () => {
    const success = await deleteLogo();
    if (success) {
      toast.success("Đã xóa logo", {
        description: "Logo tổ chức của bạn đã được xóa.",
      });
    } else {
      toast.error("Không thể xóa logo", {
        description: "Vui lòng thử lại sau.",
      });
    }
    return success;
  };

  const handleDeleteOrganization = async () => {
    const success = await deleteOrganization();
    if (success) {
      toast.success("Đã xóa tổ chức", {
        description: "Bạn sẽ được chuyển hướng trong giây lát.",
      });
      // Redirect will be handled by the backend/auth flow
      window.location.href = "/";
    } else {
      toast.error("Không thể xóa tổ chức", {
        description: "Vui lòng thử lại sau.",
      });
    }
    return success;
  };

  return (
    <>
      <div className="max-w-[900px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2" style={{ fontWeight: 600 }}>
            Cài đặt
          </h1>
          <p className="text-muted-foreground">
            Quản lý cài đặt và tùy chọn tổ chức của bạn
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          <GeneralSettings
            settings={settings}
            isLoading={isLoading}
            isSaving={isSaving}
            onSave={handleSaveSettings}
          />

          {/* Logo Upload */}
          <LogoUpload
            logoUrl={settings?.logoUrl}
            orgName={settings?.name}
            isLoading={isLoading}
            isSaving={isSaving}
            onUpload={handleUploadLogo}
            onDelete={handleDeleteLogo}
          />

          {/* Danger Zone */}
          <DangerZone
            isLoading={isLoading}
            onDeleteClick={() => setDeleteModalOpen(true)}
          />
        </div>
      </div>

      {/* Delete Organization Modal */}
      <DeleteOrgModal
        open={deleteModalOpen}
        orgName={settings?.name || ""}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteOrganization}
      />
    </>
  );
}
