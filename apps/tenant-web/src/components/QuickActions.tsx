import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { FolderPlus, UserPlus, Upload, Settings } from "lucide-react";

interface QuickActionsProps {
  onCreateProject?: () => void;
  onInviteMember?: () => void;
  onUploadFile?: () => void;
}

export function QuickActions({ 
  onCreateProject, 
  onInviteMember, 
  onUploadFile 
}: QuickActionsProps) {
  const actions = [
    {
      icon: FolderPlus,
      label: "Create Project",
      description: "Start a new project workspace",
      color: "#FF8800",
      bgColor: "#FFF4E6",
      onClick: onCreateProject
    },
    {
      icon: UserPlus,
      label: "Invite Member",
      description: "Add someone to your team",
      color: "#00C4AB",
      bgColor: "#ECFDF5",
      onClick: onInviteMember
    },
    {
      icon: Upload,
      label: "Upload File",
      description: "Share files with your team",
      color: "#3B82F6",
      bgColor: "#EEF4FF",
      onClick: onUploadFile
    }
  ];

  return (
    <Card className="p-6 shadow-md rounded-2xl border border-border">
      <div className="mb-6">
        <h3 style={{ fontWeight: 600 }}>Quick Actions</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Common tasks to get started
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:bg-muted/30 hover:shadow-md transition-all text-left group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: action.bgColor }}
              >
                <Icon size={24} style={{ color: action.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 600 }} className="mb-0.5">
                  {action.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
