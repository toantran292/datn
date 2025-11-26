import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Crown, Shield, User, Eye, Plus } from "lucide-react";

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  permissionCount: number;
}

const roleTemplates: RoleTemplate[] = [
  {
    id: "owner",
    name: "Owner",
    description: "Full access to all resources and settings",
    icon: Crown,
    color: "#FF8800",
    bgColor: "#FFF4E6",
    permissionCount: 18
  },
  {
    id: "admin",
    name: "Admin",
    description: "Manage members, projects, and most settings",
    icon: Shield,
    color: "#00C4AB",
    bgColor: "#ECFDF5",
    permissionCount: 15
  },
  {
    id: "member",
    name: "Member",
    description: "Standard access to projects and files",
    icon: User,
    color: "#3B82F6",
    bgColor: "#EEF4FF",
    permissionCount: 8
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access to projects",
    icon: Eye,
    color: "#6B7280",
    bgColor: "#F3F4F6",
    permissionCount: 4
  }
];

export function RoleTemplates() {
  return (
    <Card className="p-6 shadow-md rounded-2xl border border-border">
      <div className="mb-6">
        <h3 style={{ fontWeight: 600 }}>Role Templates</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Pre-configured permission sets
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {roleTemplates.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              className="w-full flex items-start gap-3 p-4 rounded-xl border border-border bg-white hover:bg-muted/30 hover:shadow-md transition-all text-left group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: role.bgColor }}
              >
                <Icon size={20} style={{ color: role.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontWeight: 600 }}>{role.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {role.permissionCount} permissions
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {role.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        variant="outline"
        className="w-full rounded-xl border-dashed border-2 hover:border-secondary hover:bg-secondary/5"
      >
        <Plus size={16} className="mr-2" />
        Create Custom Role
      </Button>
    </Card>
  );
}
