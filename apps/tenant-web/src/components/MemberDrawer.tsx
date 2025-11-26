import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Calendar, Trash2, X, Mail, Lock, Shield, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "./ui/separator";
import { MemberActivityLog } from "./MemberActivityLog";

interface ProjectRole {
  projectId: number;
  projectName: string;
  role: string;
}

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending";
  avatar?: string;
  joinDate: string;
  projectRoles?: ProjectRole[];
}

interface MemberDrawerProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const availableProjects = [
  { id: 1, name: "Marketing Campaign 2025" },
  { id: 2, name: "Product Development" },
  { id: 3, name: "Customer Success Hub" }
];

interface PermissionGroup {
  id: string;
  label: string;
  permissions: { id: string; label: string; enabled: boolean }[];
}

export function MemberDrawer({ member, open, onOpenChange }: MemberDrawerProps) {
  const [tenantRole, setTenantRole] = useState(member?.role || "member");
  const [projectRoles, setProjectRoles] = useState<ProjectRole[]>(
    member?.projectRoles || [
      { projectId: 1, projectName: "Marketing Campaign 2025", role: "editor" },
      { projectId: 2, projectName: "Product Development", role: "viewer" }
    ]
  );

  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([
    {
      id: "users",
      label: "Users & Roles",
      permissions: [
        { id: "users.view", label: "View Members", enabled: true },
        { id: "users.invite", label: "Invite Members", enabled: tenantRole !== "viewer" },
        { id: "users.remove", label: "Remove Members", enabled: tenantRole === "admin" || tenantRole === "owner" }
      ]
    },
    {
      id: "projects",
      label: "Projects",
      permissions: [
        { id: "projects.view", label: "View Projects", enabled: true },
        { id: "projects.create", label: "Create Projects", enabled: tenantRole !== "viewer" },
        { id: "projects.archive", label: "Archive Projects", enabled: tenantRole === "admin" || tenantRole === "owner" },
        { id: "projects.manage_roles", label: "Manage Project Roles", enabled: tenantRole === "admin" || tenantRole === "owner" }
      ]
    },
    {
      id: "files",
      label: "Files",
      permissions: [
        { id: "files.upload", label: "Upload Files", enabled: tenantRole !== "viewer" },
        { id: "files.delete", label: "Delete Files", enabled: tenantRole !== "viewer" },
        { id: "files.share", label: "Share Files", enabled: tenantRole !== "viewer" }
      ]
    },
    {
      id: "billing",
      label: "Billing",
      permissions: [
        { id: "billing.view", label: "View Billing", enabled: tenantRole === "admin" || tenantRole === "owner" },
        { id: "billing.manage", label: "Manage Payment", enabled: tenantRole === "owner" }
      ]
    },
    {
      id: "integrations",
      label: "Integrations",
      permissions: [
        { id: "integrations.view", label: "View Integrations", enabled: true },
        { id: "integrations.configure", label: "Configure Integrations", enabled: tenantRole === "admin" || tenantRole === "owner" }
      ]
    }
  ]);

  if (!member) return null;

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleSave = () => {
    toast.success("Member updated successfully", {
      description: "Changes have been saved."
    });
    onOpenChange(false);
  };

  const handleRemove = () => {
    toast.success(`${member.name} removed from organization`, {
      description: "The member has been removed."
    });
    onOpenChange(false);
  };

  const handleProjectRoleChange = (projectId: number, newRole: string) => {
    setProjectRoles(prev =>
      prev.map(pr => pr.projectId === projectId ? { ...pr, role: newRole } : pr)
    );
  };

  const handleRemoveProjectAccess = (projectId: number) => {
    setProjectRoles(prev => prev.filter(pr => pr.projectId !== projectId));
    toast.success("Project access removed");
  };

  const handleAddProjectAccess = (projectId: number) => {
    const project = availableProjects.find(p => p.id === projectId);
    if (project && !projectRoles.find(pr => pr.projectId === projectId)) {
      setProjectRoles(prev => [...prev, { projectId, projectName: project.name, role: "viewer" }]);
      toast.success(`Added to ${project.name}`);
    }
  };

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

  const unassignedProjects = availableProjects.filter(
    p => !projectRoles.find(pr => pr.projectId === p.id)
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return { bg: "#FFF4E6", color: "#FF8800" };
      case "admin":
        return { bg: "#ECFDF5", color: "#00C4AB" };
      case "member":
        return { bg: "#EEF4FF", color: "#3B82F6" };
      case "viewer":
        return { bg: "#F3F4F6", color: "#6B7280" };
      default:
        return { bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  const roleBadgeColor = getRoleBadgeColor(tenantRole);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle style={{ fontWeight: 600 }}>Member Details</SheetTitle>
          <SheetDescription>
            Manage roles, permissions, and project access
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl border border-border">
            <Avatar className="h-16 w-16 ring-2 ring-white">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 style={{ fontWeight: 600 }} className="mb-1">{member.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
              <div className="flex items-center gap-2">
                <Badge
                  style={{
                    backgroundColor: member.status === "active" ? "#ECFDF5" : "#FEF3C7",
                    color: member.status === "active" ? "#00C4AB" : "#F59E0B",
                    border: "none"
                  }}
                >
                  {member.status === "active" ? "Active" : "Pending"}
                </Badge>
                <Badge
                  className="capitalize"
                  style={{
                    backgroundColor: roleBadgeColor.bg,
                    color: roleBadgeColor.color,
                    border: "none"
                  }}
                >
                  <Shield size={12} className="mr-1" />
                  {tenantRole}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={12} />
                  <span>Joined {member.joinDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted rounded-xl p-1">
              <TabsTrigger value="overview" className="rounded-lg text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="tenant" className="rounded-lg text-xs sm:text-sm">
                Tenant Role
              </TabsTrigger>
              <TabsTrigger value="projects" className="rounded-lg text-xs sm:text-sm">
                Projects
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-lg text-xs sm:text-sm">
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-5 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className="text-primary" />
                    <span className="text-sm text-muted-foreground">Tenant Role</span>
                  </div>
                  <p style={{ fontWeight: 600 }} className="capitalize">{tenantRole}</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderKanban size={16} className="text-secondary" />
                    <span className="text-sm text-muted-foreground">Projects</span>
                  </div>
                  <p style={{ fontWeight: 600 }}>{projectRoles.length} assigned</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="mb-3" style={{ fontWeight: 600 }}>Project Memberships</h4>
                {projectRoles.length > 0 ? (
                  <div className="space-y-2">
                    {projectRoles.map((pr) => (
                      <div
                        key={pr.projectId}
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <span className="text-white text-xs" style={{ fontWeight: 600 }}>
                              {pr.projectName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm" style={{ fontWeight: 500 }}>{pr.projectName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{pr.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-muted/20 rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      No project assignments
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tenant Role & Permissions Tab */}
            <TabsContent value="tenant" className="space-y-5 mt-6">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Organization Role</Label>
                <Select value={tenantRole} onValueChange={setTenantRole}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Organization-level role with pre-configured permissions
                </p>
              </div>

              <Separator />

              {/* Permissions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm" style={{ fontWeight: 600 }}>
                    <Lock size={16} className="inline mr-2" />
                    Detailed Permissions
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {permissionGroups.reduce((acc, g) => acc + g.permissions.filter(p => p.enabled).length, 0)} enabled
                  </Badge>
                </div>

                {permissionGroups.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <h5 className="text-sm" style={{ fontWeight: 600 }}>{group.label}</h5>
                    <div className="space-y-2 pl-2">
                      {group.permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30"
                        >
                          <Label htmlFor={permission.id} className="text-sm cursor-pointer flex-1">
                            {permission.label}
                          </Label>
                          <Switch
                            id={permission.id}
                            checked={permission.enabled}
                            onCheckedChange={() => handlePermissionToggle(group.id, permission.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Project Roles Tab */}
            <TabsContent value="projects" className="space-y-5 mt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm" style={{ fontWeight: 600 }}>Assigned Projects</h4>
                  <span className="text-xs text-muted-foreground">
                    {projectRoles.length} project{projectRoles.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {projectRoles.length > 0 ? (
                  <div className="space-y-3">
                    {projectRoles.map((pr) => (
                      <div
                        key={pr.projectId}
                        className="p-4 rounded-xl border border-border bg-white hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <span className="text-white text-xs" style={{ fontWeight: 600 }}>
                                  {pr.projectName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                </span>
                              </div>
                              <span className="text-sm" style={{ fontWeight: 600 }}>
                                {pr.projectName}
                              </span>
                            </div>
                            <Select
                              value={pr.role}
                              onValueChange={(value) => handleProjectRoleChange(pr.projectId, value)}
                            >
                              <SelectTrigger className="rounded-lg h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => handleRemoveProjectAccess(pr.projectId)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-muted/30 rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      No project access assigned
                    </p>
                  </div>
                )}
              </div>

              {/* Add Project Access */}
              {unassignedProjects.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <Label className="mb-2 block">Add Project Access</Label>
                  <Select onValueChange={(value) => handleAddProjectAccess(parseInt(value))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            {/* Activity Log Tab */}
            <TabsContent value="activity" className="mt-6">
              <MemberActivityLog />
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="space-y-3 pt-6 border-t border-border">
            {member.status === "pending" && (
              <Button
                variant="outline"
                className="w-full rounded-xl border-secondary text-secondary hover:bg-secondary/10"
              >
                <Mail size={16} className="mr-2" />
                Resend Invitation
              </Button>
            )}

            <Button
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-white"
              onClick={handleSave}
            >
              Save Changes
            </Button>

            <Button
              variant="outline"
              className="w-full rounded-xl text-destructive border-destructive hover:bg-destructive/10"
              onClick={handleRemove}
            >
              <Trash2 size={16} className="mr-2" />
              Remove from Organization
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
