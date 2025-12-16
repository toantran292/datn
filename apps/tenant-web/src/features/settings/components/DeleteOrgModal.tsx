import { useState } from "react";
import { ModalCore, EModalWidth, EModalPosition, Button, Input } from "@uts/design-system/ui";
import { AlertTriangle, X } from "lucide-react";

interface DeleteOrgModalProps {
  open: boolean;
  orgName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
}

export function DeleteOrgModal({ open, orgName, onOpenChange, onConfirm }: DeleteOrgModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedText = orgName.toLowerCase();
  const isConfirmed = confirmText.toLowerCase() === expectedText;

  const handleClose = () => {
    if (isDeleting) return;
    onOpenChange(false);
    setConfirmText("");
  };

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    try {
      const success = await onConfirm();
      if (success) {
        handleClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalCore
      isOpen={open}
      handleClose={handleClose}
      width={EModalWidth.MD}
      position={EModalPosition.CENTER}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-custom-text-100">
                Delete Organization
              </h3>
              <p className="text-sm text-custom-text-300">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1.5 rounded-md hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-4">
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Deleting this organization will permanently remove:
            </p>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
              <li>All projects and their data</li>
              <li>All files and documents</li>
              <li>All member associations</li>
              <li>All settings and configurations</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-delete" className="text-sm font-medium text-custom-text-200">
              Type <span className="font-mono bg-custom-background-80 px-1.5 py-0.5 rounded">{orgName}</span> to confirm
            </label>
            <Input
              id="confirm-delete"
              type="text"
              placeholder="Enter organization name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              inputSize="md"
              className="w-full"
              autoComplete="off"
            />
          </div>
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
            variant="danger"
            size="md"
            loading={isDeleting}
            disabled={!isConfirmed || isDeleting}
            onClick={handleDelete}
          >
            Delete Organization
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
