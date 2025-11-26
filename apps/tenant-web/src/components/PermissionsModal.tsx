import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Users,
  FolderKanban,
  File,
  CreditCard,
  Puzzle,
  Lock,
  Info
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface Permission {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface PermissionGroup {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  permissions: Permission[];
}

interface PermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName?: string;
  memberRole?: string;
}

export function PermissionsModal({
  open,
  onOpenChange,
  memberName = "Member",
  memberRole = "member"
}: PermissionsModalProps) {
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([
    {
      id: "users",
      label: "Users & Roles",
      icon: Users,
      color: "#3B82F6",
      bgColor: "#EEF4FF",
      permissions: [
        {
          id: "users.view",
          label: "View Members",
          description: "View organization members and their roles",
          enabled: true
        },
        {
          id: "users.invite",
          label: "Invite Members",
          description: "Send invitations to new team members",
          enabled: memberRole === "admin" || memberRole === "owner"
        },
        {
          id: "users.remove",
          label: "Remove Members",
          description: "Remove members from the organization",
          enabled: memberRole === "admin" || memberRole === "owner"
        },
        {
          id: "users.manage_roles",
          label: "Manage Roles",
          description: "Change member roles and permissions",
          enabled: memberRole === "owner"
        }
      ]
    },
    {
      id: "projects",
      label: "Projects",
      icon: FolderKanban,
      color: "#00C4AB",
      bgColor: "#ECFDF5",
      permissions: [
        {
          id: "projects.view",
          label: "View Projects",
          description: "View all organization projects",
          enabled: true
        },
        {
          id: "projects.create",
          label: "Create Projects",
          description: "Create new project workspaces",
          enabled: memberRole !== "viewer"
        },
        {
          id: "projects.archive",
          label: "Archive Projects",
          description: "Archive or delete projects",
          enabled: memberRole === "admin" || memberRole === "owner"
        },
        {
          id: "projects.manage_roles",
          label: "Manage Project Roles",
          description: "Assign members to projects and manage their roles",
          enabled: memberRole === "admin" || memberRole === "owner"
        }
      ]
    },
    {
      id: "files",
      label: "Files & Storage",
      icon: File,
      color: "#FF8800",
      bgColor: "#FFF4E6",
      permissions: [
        {
          id: "files.view",
          label: "View Files",
          description: "View and download organization files",
          enabled: true
        },
        {
          id: "files.upload",
          label: "Upload Files",
          description: "Upload files to projects and folders",
          enabled: memberRole !== "viewer"
        },
        {
          id: "files.delete",
          label: "Delete Files",
          description: "Delete files and folders",
          enabled: memberRole !== "viewer"
        },
        {
          id: "files.share",
          label: "Share Files",
          description: "Share files with external users",
          enabled: memberRole !== "viewer"
        }
      ]
    },
    {
      id: "billing",
      label: "Billing & Payments",
      icon: CreditCard,
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
      permissions: [
        {
          id: "billing.view",
          label: "View Billing",
          description: "View invoices and payment history",
          enabled: memberRole === "admin" || memberRole === "owner"
        },
        {
          id: "billing.manage",
          label: "Manage Payments",
          description: "Update payment methods and billing info",
          enabled: memberRole === "owner"
        }
      ]
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: Puzzle,
      color: "#EC4899",
      bgColor: "#FCE7F3",
      permissions: [
        {
          id: "integrations.view",
          label: "View Integrations",
          description: "View connected integrations and apps",
          enabled: true
        },
        {
          id: "integrations.configure",
          label: "Configure Integrations",
          description: "Add and configure third-party integrations",
          enabled: memberRole === "admin" || memberRole === "owner"
        }
      ]
    }
  ]);

  const handlePermissionToggle = (groupId: string, permissionId: string) => {
    setPermissionGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              permissions: group.permissions.map(p =>
                p.id === permissionId ? { ...p, enabled: !p.enabled } : p
              )
            }
          : group
      )
    );
  };

  const handleSave = () => {
    toast.success("Permissions updated", {
      description: `Permissions for ${memberName} have been saved.`
    });
    onOpenChange(false);
  };

  const totalPermissions = permissionGroups.reduce(
    (acc, group) => acc + group.permissions.length,
    0
  );
  const enabledPermissions = permissionGroups.reduce(
    (acc, group) => acc + group.permissions.filter(p => p.enabled).length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle style={{ fontWeight: 600 }}>
                Manage Permissions
              </DialogTitle>
              <DialogDescription>
                Configure detailed permissions for {memberName}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-secondary/5 border-secondary/20">
              {enabledPermissions} / {totalPermissions} enabled
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 py-4">
            {permissionGroups.map((group) => {
              const Icon = group.icon;
              const groupEnabledCount = group.permissions.filter(p => p.enabled).length;

              return (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center gap-3 pb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: group.bgColor }}
                    >
                      <Icon size={20} style={{ color: group.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 style={{ fontWeight: 600 }}>{group.label}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {groupEnabledCount} / {group.permissions.length}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pl-2">
                    {group.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                          permission.enabled
                            ? 'bg-muted/30 border-border'
                            : 'bg-white border-border hover:bg-muted/20'
                        }`}
                      >
                        <Checkbox
                          id={permission.id}
                          checked={permission.enabled}
                          onCheckedChange={() =>
                            handlePermissionToggle(group.id, permission.id)
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={permission.id}
                              className="cursor-pointer"
                              style={{ fontWeight: 500 }}
                            >
                              {permission.label}
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground">
                                    <Info size={14} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">{permission.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-primary hover:bg-primary/90 text-white"
          >
            <Lock size={16} className="mr-2" />
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
