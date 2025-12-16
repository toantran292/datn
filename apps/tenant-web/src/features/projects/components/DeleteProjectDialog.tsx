"use client";

import { useState } from "react";
import { ModalCore, EModalWidth, EModalPosition, Button } from "@uts/design-system/ui";
import { X, Trash2, AlertTriangle } from "lucide-react";
import type { ProjectLite } from "../hooks/useProjects";

interface DeleteProjectDialogProps {
  project: ProjectLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (project: ProjectLite) => Promise<void>;
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onConfirm,
}: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      await onConfirm(project);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalCore
      isOpen={open}
      handleClose={handleClose}
      width={EModalWidth.SM}
      position={EModalPosition.CENTER}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-custom-text-100">
            Delete Project
          </h3>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-md hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-5">
        <p className="text-sm text-custom-text-200">
          Are you sure you want to delete <strong className="text-custom-text-100">{project?.name}</strong>?
        </p>
        <p className="text-sm text-custom-text-300 mt-2">
          This will permanently delete all issues, sprints, and data associated with this project. This action cannot be undone.
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-custom-border-200">
        <Button
          variant="neutral-primary"
          size="md"
          onClick={handleClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          loading={isDeleting}
          disabled={isDeleting}
          onClick={handleConfirm}
          prependIcon={<Trash2 size={16} />}
          className="bg-red-600 hover:bg-red-700"
        >
          Delete Project
        </Button>
      </div>
    </ModalCore>
  );
}
