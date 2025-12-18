"use client";

import { useState, useEffect } from "react";
import { ModalCore, EModalWidth, EModalPosition, Button } from "@uts/design-system/ui";
import { X, FolderKanban, Check } from "lucide-react";
import { useProjects, type ProjectLite } from "@/features/projects/hooks/useProjects";

interface ManageProjectsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    name: string;
    currentProjectIds: string[];
  } | null;
  onConfirm: (projectIds: string[]) => Promise<void>;
}

export function ManageProjectsModal({
  open,
  onOpenChange,
  member,
  onConfirm,
}: ManageProjectsModalProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { projects, isLoading } = useProjects();

  useEffect(() => {
    if (member) {
      setSelectedProjects(member.currentProjectIds);
    }
  }, [member]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(selectedProjects);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <ModalCore
      isOpen={open}
      handleClose={handleClose}
      width={EModalWidth.MD}
      position={EModalPosition.CENTER}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
        <div>
          <h3 className="text-lg font-semibold text-custom-text-100">
            Quản lý dự án
          </h3>
          <p className="text-sm text-custom-text-300 mt-0.5">
            Chọn dự án cho <strong>{member.name}</strong>
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
      <div className="px-5 py-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-custom-primary-100 border-t-transparent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <FolderKanban className="mx-auto h-12 w-12 text-custom-text-400 mb-3" />
            <p className="text-custom-text-300">Không có dự án nào</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {projects.map((project) => {
              const isSelected = selectedProjects.includes(project.id);
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => toggleProject(project.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? "border-[#00C4AB] bg-[#00C4AB]/5"
                      : "border-custom-border-200 hover:border-custom-border-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected
                      ? "border-[#00C4AB] bg-[#00C4AB]"
                      : "border-custom-border-300"
                  }`}>
                    {isSelected && <Check size={14} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-custom-text-100 truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-custom-text-300">
                      {project.identifier}
                    </p>
                  </div>
                  <div className="text-xs text-custom-text-400">
                    {project.issueCount ?? 0} issue
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-custom-border-200">
          <p className="text-sm text-custom-text-300">
            Đã chọn {selectedProjects.length} dự án
          </p>
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
          variant="primary"
          size="md"
          loading={isSubmitting}
          disabled={isSubmitting}
          onClick={handleConfirm}
          className="bg-[#00C4AB] hover:bg-[#00B09A]"
        >
          Lưu thay đổi
        </Button>
      </div>
    </ModalCore>
  );
}
