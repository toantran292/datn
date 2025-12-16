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
      toast.success("Settings saved", {
        description: "Your organization settings have been updated.",
      });
    } else {
      toast.error("Failed to save settings", {
        description: "Please try again later.",
      });
    }
    return success;
  };

  const handleUploadLogo = async (file: File) => {
    const success = await uploadLogo(file);
    if (success) {
      toast.success("Logo uploaded", {
        description: "Your organization logo has been updated.",
      });
    } else {
      toast.error("Failed to upload logo", {
        description: "Please try again later.",
      });
    }
    return success;
  };

  const handleDeleteLogo = async () => {
    const success = await deleteLogo();
    if (success) {
      toast.success("Logo removed", {
        description: "Your organization logo has been deleted.",
      });
    } else {
      toast.error("Failed to remove logo", {
        description: "Please try again later.",
      });
    }
    return success;
  };

  const handleDeleteOrganization = async () => {
    const success = await deleteOrganization();
    if (success) {
      toast.success("Organization deleted", {
        description: "You will be redirected shortly.",
      });
      // Redirect will be handled by the backend/auth flow
      window.location.href = "/";
    } else {
      toast.error("Failed to delete organization", {
        description: "Please try again later.",
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
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your organization settings and preferences
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
