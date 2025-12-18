import { useState, useEffect } from "react";
import { ModalCore, EModalWidth, EModalPosition, Button } from "@uts/design-system/ui";
import { Shield, X } from "lucide-react";

interface ChangeRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: { id: string; name: string; currentRole: string } | null;
  onConfirm: (newRole: string) => Promise<void>;
}

type MemberRole = "ADMIN" | "MEMBER";

export function ChangeRoleModal({ open, onOpenChange, member, onConfirm }: ChangeRoleModalProps) {
  const [role, setRole] = useState<MemberRole>("MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync role with member's current role when modal opens
  useEffect(() => {
    if (member?.currentRole) {
      setRole(member.currentRole.toUpperCase() as MemberRole);
    }
  }, [member?.currentRole]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setIsSubmitting(true);
    try {
      await onConfirm(role);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore
      isOpen={open}
      handleClose={handleClose}
      width={EModalWidth.MD}
      position={EModalPosition.CENTER}
    >
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
          <div>
            <h3 className="text-lg font-semibold text-custom-text-100">
              Thay đổi vai trò
            </h3>
            <p className="text-sm text-custom-text-300 mt-0.5">
              Cập nhật vai trò cho {member?.name}
            </p>
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
        <div className="px-5 py-5 space-y-5">
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-custom-text-200">
              Chọn vai trò
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  role === "ADMIN"
                    ? "border-[#00C4AB] bg-[#00C4AB]/5"
                    : "border-custom-border-200 hover:border-custom-border-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    role === "ADMIN" ? "border-[#00C4AB]" : "border-custom-border-300"
                  }`}>
                    {role === "ADMIN" && (
                      <div className="w-2 h-2 rounded-full bg-[#00C4AB]" />
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${
                    role === "ADMIN" ? "text-[#00C4AB]" : "text-custom-text-100"
                  }`}>
                    Admin
                  </span>
                </div>
                <p className="text-xs text-custom-text-300 ml-6">
                  Truy cập đầy đủ vào tất cả dự án và cài đặt
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole("MEMBER")}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  role === "MEMBER"
                    ? "border-[#00C4AB] bg-[#00C4AB]/5"
                    : "border-custom-border-200 hover:border-custom-border-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    role === "MEMBER" ? "border-[#00C4AB]" : "border-custom-border-300"
                  }`}>
                    {role === "MEMBER" && (
                      <div className="w-2 h-2 rounded-full bg-[#00C4AB]" />
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${
                    role === "MEMBER" ? "text-[#00C4AB]" : "text-custom-text-100"
                  }`}>
                    Member
                  </span>
                </div>
                <p className="text-xs text-custom-text-300 ml-6">
                  Chỉ truy cập vào các dự án được gán
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-custom-border-200">
          <Button
            variant="neutral-primary"
            size="md"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            disabled={isSubmitting || role.toLowerCase() === member?.currentRole}
            prependIcon={<Shield size={16} />}
            className="bg-[#00C4AB] hover:bg-[#00B09A]"
          >
            Cập nhật vai trò
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
