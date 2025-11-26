import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Search, UserPlus, MoreVertical, Edit, Trash2, Mail, Plus, Shield, Eye } from "lucide-react";
import { MemberDrawer } from "./MemberDrawer";
import { InviteMemberModal } from "./InviteMemberModal";
import { PermissionsModal } from "./PermissionsModal";
import { RoleTemplates } from "./RoleTemplates";
import { toast } from "sonner";
import { useMembers } from "../hooks/useMembers";

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

export function MembersPage() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [permissionsModalMember, setPermissionsModalMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Fetch members from API
  const { members: apiMembers, totalMembers, isLoading, error, invite, remove } = useMembers();

  // Transform API members to component's Member interface
  const members: Member[] = apiMembers.map((apiMember) => ({
    id: parseInt(apiMember.id) || 0,
    name: apiMember.display_name || apiMember.email.split('@')[0],
    email: apiMember.email,
    role: apiMember.role,
    status: apiMember.status,
    avatar: apiMember.avatar_url,
    joinDate: new Date(apiMember.joined_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    projectRoles: apiMember.project_roles?.map(pr => ({
      projectId: parseInt(pr.project_id) || 0,
      projectName: pr.project_name,
      role: pr.role
    }))
  }));

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setDrawerOpen(true);
  };

  const handleViewPermissions = (e: React.MouseEvent, member: Member) => {
    e.stopPropagation();
    setPermissionsModalMember(member);
    setPermissionsModalOpen(true);
  };

  const handleInvite = async (data: { name: string; email: string; role: string; projects: number[] }) => {
    const result = await invite({
      email: data.email,
      role: data.role,
      project_ids: data.projects.map(id => id.toString())
    });

    if (result) {
      toast.success(`Invitation sent to ${data.email}`, {
        description: `${data.name} will receive an email to join the organization.`,
      });
      setInviteModalOpen(false);
    } else {
      toast.error(`Failed to invite ${data.email}`, {
        description: error || 'Please try again later.',
      });
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    const success = await remove(memberId);
    if (success) {
      toast.success(`${memberName} has been removed from the organization`);
    } else {
      toast.error(`Failed to remove ${memberName}`, {
        description: error || 'Please try again later.',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

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

  const getProjectRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return { bg: "bg-orange-50", text: "text-primary", border: "border-primary/20" };
      case "editor":
        return { bg: "bg-teal-50", text: "text-secondary", border: "border-secondary/20" };
      case "viewer":
        return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
      default:
        return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500/20 border-t-orange-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
              <p className="font-medium">Failed to load members</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2" style={{ fontWeight: 600 }}>
            Members & Permissions
          </h1>
          <p className="text-muted-foreground">
            Manage your organization's roles and access controls
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search members by name or email..."
                  className="pl-10 rounded-xl bg-white border-border h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Project filter - commented out until project API is implemented
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full lg:w-52 rounded-xl bg-white h-11">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                </SelectContent>
              </Select>
              */}

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full lg:w-44 rounded-xl bg-white h-11">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="rounded-xl h-11 lg:w-auto hidden sm:flex"
              >
                Bulk Actions
              </Button>

              <Button
                className="rounded-xl bg-secondary hover:bg-secondary/90 text-white h-11 lg:w-auto"
                onClick={() => setInviteModalOpen(true)}
              >
                <UserPlus size={18} className="mr-2" />
                Invite Member
              </Button>
            </div>

            {/* Table - Desktop */}
            <div className="bg-white rounded-2xl border border-border shadow-md overflow-hidden hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tenant Role</TableHead>
                    <TableHead>Project Roles</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const roleBadgeColor = getRoleBadgeColor(member.role);
                    const initials = getInitials(member.name);

                    return (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => handleMemberClick(member)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span style={{ fontWeight: 500 }}>{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="capitalize"
                            style={{
                              backgroundColor: roleBadgeColor.bg,
                              color: roleBadgeColor.color,
                              border: "none"
                            }}
                          >
                            <Shield size={12} className="mr-1" />
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {member.projectRoles && member.projectRoles.length > 0 ? (
                              member.projectRoles.slice(0, 2).map((pr, idx) => {
                                const colors = getProjectRoleBadgeColor(pr.role);
                                return (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className={`text-xs ${colors.bg} ${colors.text} ${colors.border}`}
                                  >
                                    {pr.projectName.length > 15
                                      ? pr.projectName.substring(0, 15) + '...'
                                      : pr.projectName}: {pr.role}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground">No projects</span>
                            )}
                            {member.projectRoles && member.projectRoles.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{member.projectRoles.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg hover:bg-secondary/10 hover:text-secondary h-8"
                            onClick={(e) => handleViewPermissions(e, member)}
                          >
                            <Eye size={14} className="mr-1.5" />
                            View / Edit
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge
                            style={{
                              backgroundColor: member.status === "active" ? "#ECFDF5" : "#FEF3C7",
                              color: member.status === "active" ? "#00C4AB" : "#F59E0B",
                              border: "none"
                            }}
                          >
                            {member.status === "active" ? "Active" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMemberClick(member);
                                }}
                              >
                                <Edit size={16} className="mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleViewPermissions(e, member)}
                              >
                                <Shield size={16} className="mr-2" />
                                Manage Permissions
                              </DropdownMenuItem>
                              {member.status === "pending" && (
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <Mail size={16} className="mr-2" />
                                  Resend Invite
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMember(member.id.toString(), member.name);
                                }}
                              >
                                <Trash2 size={16} className="mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Card List - Mobile/Tablet */}
            <div className="lg:hidden space-y-4">
              {filteredMembers.map((member) => {
                const roleBadgeColor = getRoleBadgeColor(member.role);
                const initials = getInitials(member.name);

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleMemberClick(member)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate" style={{ fontWeight: 600 }}>{member.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMemberClick(member);
                            }}
                          >
                            <Edit size={16} className="mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleViewPermissions(e, member)}
                          >
                            <Shield size={16} className="mr-2" />
                            Manage Permissions
                          </DropdownMenuItem>
                          {member.status === "pending" && (
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Mail size={16} className="mr-2" />
                              Resend Invite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMember(member.id.toString(), member.name);
                            }}
                          >
                            <Trash2 size={16} className="mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge
                        className="capitalize"
                        style={{
                          backgroundColor: roleBadgeColor.bg,
                          color: roleBadgeColor.color,
                          border: "none"
                        }}
                      >
                        <Shield size={12} className="mr-1" />
                        {member.role}
                      </Badge>
                      <Badge
                        style={{
                          backgroundColor: member.status === "active" ? "#ECFDF5" : "#FEF3C7",
                          color: member.status === "active" ? "#00C4AB" : "#F59E0B",
                          border: "none"
                        }}
                      >
                        {member.status === "active" ? "Active" : "Pending"}
                      </Badge>
                    </div>

                    {member.projectRoles && member.projectRoles.length > 0 && (
                      <div className="pt-3 border-t border-border mb-3">
                        <p className="text-xs text-muted-foreground mb-2">Projects:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {member.projectRoles.map((pr, idx) => {
                            const colors = getProjectRoleBadgeColor(pr.role);
                            return (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={`text-xs ${colors.bg} ${colors.text} ${colors.border}`}
                              >
                                {pr.projectName}: {pr.role}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-lg hover:bg-secondary/10 hover:text-secondary"
                      onClick={(e) => handleViewPermissions(e, member)}
                    >
                      <Eye size={14} className="mr-1.5" />
                      View Permissions
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Results Summary */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredMembers.length} of {totalMembers} members
            </div>
          </div>

          {/* Sidebar - Role Templates */}
          <div className="hidden xl:block">
            <RoleTemplates />
          </div>
        </div>
      </div>

      {/* Floating Add Button - Mobile only */}
      <button
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group sm:hidden"
        style={{ backgroundColor: "#00C4AB" }}
        onClick={() => setInviteModalOpen(true)}
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Modals */}
      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInvite}
      />

      <PermissionsModal
        open={permissionsModalOpen}
        onOpenChange={setPermissionsModalOpen}
        memberName={permissionsModalMember?.name}
        memberRole={permissionsModalMember?.role}
      />

      <MemberDrawer
        member={selectedMember}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
