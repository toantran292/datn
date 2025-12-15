"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Shield,
  FolderKanban,
  X,
  RefreshCw,
} from "lucide-react";
import { InviteMemberModal } from "./components/InviteMemberModal";
import { toast } from "sonner";
import { useMembersUnified } from "./hooks/useMembersUnified";

type FilterStatus = "all" | "active" | "pending";

export function MembersView() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const {
    items,
    totalMembers,
    totalInvitations,
    isLoading,
    error,
    refetch,
    invite,
    removeMember,
    cancelInvitation,
  } = useMembersUnified();

  // Filter logic
  const filteredList = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || item.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [items, searchQuery, roleFilter, statusFilter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: items.length,
      active: totalMembers,
      pending: totalInvitations,
    };
  }, [items.length, totalMembers, totalInvitations]);

  const handleInvite = async (data: {
    email: string;
    role: string;
  }) => {
    const success = await invite({
      email: data.email,
      role: data.role,
    });

    if (success) {
      toast.success(`Invitation sent to ${data.email}`, {
        description: "They will receive an email to join the organization.",
      });
      setInviteModalOpen(false);
    } else {
      toast.error(`Failed to invite ${data.email}`, {
        description: error || "Please try again later.",
      });
    }
  };

  const handleCancelInvitation = async (id: string, email: string) => {
    const success = await cancelInvitation(id);
    if (success) {
      toast.success(`Invitation to ${email} has been cancelled`);
    } else {
      toast.error(`Failed to cancel invitation`);
    }
  };

  const handleResendInvitation = async (email: string) => {
    // TODO: Implement resend API
    toast.info(`Resending invitation to ${email}...`);
  };

  const handleRemoveMember = async (id: string, name: string) => {
    const success = await removeMember(id);
    if (success) {
      toast.success(`${name} has been removed from the organization`);
    } else {
      toast.error(`Failed to remove ${name}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "owner":
        return { bg: "#FFF4E6", color: "#FF8800" };
      case "admin":
        return { bg: "#ECFDF5", color: "#00C4AB" };
      case "member":
        return { bg: "#EEF4FF", color: "#3B82F6" };
      default:
        return { bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  const getStatusBadgeStyle = (status: "active" | "pending") => {
    return status === "active"
      ? { bg: "#ECFDF5", color: "#00C4AB" }
      : { bg: "#FEF3C7", color: "#F59E0B" };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary/20 border-t-secondary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              Loading members...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4">
              <p className="font-medium">Failed to load members</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button
              onClick={() => refetch()}
              className="rounded-xl"
            >
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-1">
            <h1 className="text-2xl font-semibold">Members</h1>
            <Button
              className="shrink-0 rounded-xl bg-[#00C4AB] hover:bg-[#00B09A] text-white"
              onClick={() => setInviteModalOpen(true)}
            >
              <UserPlus size={18} className="mr-2" />
              Invite Member
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage organization members and invitations
          </p>
        </div>

        {/* Filter Pills + Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Status Filter Pills */}
          <div className="inline-flex bg-custom-background-90 rounded-xl p-1 gap-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-white text-custom-text-100 shadow-sm"
                  : "text-custom-text-300 hover:text-custom-text-100"
              }`}
            >
              All
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-xs ${
                statusFilter === "all"
                  ? "bg-custom-background-90"
                  : "bg-custom-background-80"
              }`}>
                {counts.all}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === "active"
                  ? "bg-white text-custom-text-100 shadow-sm"
                  : "text-custom-text-300 hover:text-custom-text-100"
              }`}
            >
              Active
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-xs ${
                statusFilter === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-custom-background-80"
              }`}>
                {counts.active}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === "pending"
                  ? "bg-white text-custom-text-100 shadow-sm"
                  : "text-custom-text-300 hover:text-custom-text-100"
              }`}
            >
              Pending
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-xs ${
                statusFilter === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-custom-background-80"
              }`}>
                {counts.pending}
              </span>
            </button>
          </div>

          {/* Search + Role Filter */}
          <div className="flex flex-1 gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder="Search by name or email..."
                className="pl-10 rounded-xl bg-white border-border h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36 rounded-xl bg-white h-10">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[280px]">Member</TableHead>
                <TableHead className="w-[120px]">Role</TableHead>
                <TableHead className="w-[140px]">Projects</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="text-muted-foreground">
                      <p className="font-medium">No members found</p>
                      <p className="text-sm">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item) => {
                  const roleBadgeStyle = getRoleBadgeStyle(item.role);
                  const statusBadgeStyle = getStatusBadgeStyle(item.status);
                  const projectCount = item.projectRoles?.length || 0;

                  return (
                    <TableRow
                      key={`${item.type}-${item.id}`}
                      className="hover:bg-muted/20"
                    >
                      {/* Member Info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.status === "active" ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={item.avatarUrl} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                                {getInitials(item.displayName)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <Mail size={18} className="text-amber-600" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {item.status === "active" ? item.displayName : item.email}
                            </p>
                            {item.status === "active" && (
                              <p className="text-sm text-muted-foreground truncate">
                                {item.email}
                              </p>
                            )}
                            {item.status === "pending" && (
                              <p className="text-xs text-muted-foreground">
                                Invited {formatDate(item.invitedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Badge
                          className="capitalize font-medium"
                          style={{
                            backgroundColor: roleBadgeStyle.bg,
                            color: roleBadgeStyle.color,
                            border: "none",
                          }}
                        >
                          <Shield size={12} className="mr-1" />
                          {item.role}
                        </Badge>
                      </TableCell>

                      {/* Projects */}
                      <TableCell>
                        {item.status === "pending" ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : item.role === "owner" || item.role === "admin" ? (
                          <span className="flex items-center gap-1.5 text-sm text-secondary font-medium">
                            <FolderKanban size={14} />
                            All projects
                          </span>
                        ) : projectCount > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <FolderKanban size={14} />
                                <span>
                                  {projectCount} project
                                  {projectCount !== 1 ? "s" : ""}
                                </span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-64 p-0 rounded-xl"
                              align="start"
                            >
                              <div className="p-3 border-b border-border">
                                <h4 className="font-medium text-sm">
                                  Joined Projects
                                </h4>
                              </div>
                              <div className="p-2 max-h-48 overflow-y-auto">
                                {item.projectRoles?.map((pr, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/50"
                                  >
                                    <span className="text-sm truncate flex-1">
                                      {pr.projectName}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs capitalize ml-2"
                                    >
                                      {pr.role}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No projects
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          className="capitalize font-medium"
                          style={{
                            backgroundColor: statusBadgeStyle.bg,
                            color: statusBadgeStyle.color,
                            border: "none",
                          }}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-xl w-48"
                          >
                            {item.status === "active" ? (
                              <>
                                <DropdownMenuItem>
                                  <Edit size={16} className="mr-2" />
                                  Edit Member
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Shield size={16} className="mr-2" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    handleRemoveMember(item.id, item.displayName)
                                  }
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleResendInvitation(item.email)
                                  }
                                >
                                  <RefreshCw size={16} className="mr-2" />
                                  Resend Invitation
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    handleCancelInvitation(item.id, item.email)
                                  }
                                >
                                  <X size={16} className="mr-2" />
                                  Cancel Invitation
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredList.length} of {counts.all} members
        </div>
      </div>

      {/* Invite Modal */}
      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInvite}
      />
    </>
  );
}
