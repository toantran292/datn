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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  UserPlus,
  MoreVertical,
  Mail,
  Shield,
  FolderKanban,
  X,
  RefreshCw,
  Copy,
  UserCircle,
  Link,
  UserMinus,
} from "lucide-react";
import { InviteMemberModal } from "./components/InviteMemberModal";
import { ChangeRoleModal } from "./components/ChangeRoleModal";
import { ManageProjectsModal } from "./components/ManageProjectsModal";
import { toast } from "sonner";
import { useMembersUnified } from "./hooks/useMembersUnified";

type FilterStatus = "all" | "active" | "pending";

export function MembersView() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false);
  const [manageProjectsModalOpen, setManageProjectsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; currentRole: string } | null>(null);
  const [selectedMemberForProjects, setSelectedMemberForProjects] = useState<{ id: string; name: string; currentProjectIds: string[] } | null>(null);
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
    resendInvitation,
    updateMemberRole,
    updateMemberProjects,
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
      toast.success(`Đã gửi lời mời đến ${data.email}`, {
        description: "Họ sẽ nhận được email để tham gia tổ chức.",
      });
      setInviteModalOpen(false);
    } else {
      toast.error(`Không thể mời ${data.email}`, {
        description: error || "Vui lòng thử lại sau.",
      });
    }
  };

  const handleCancelInvitation = async (id: string, email: string) => {
    const success = await cancelInvitation(id);
    if (success) {
      toast.success(`Đã hủy lời mời đến ${email}`);
    } else {
      toast.error(`Không thể hủy lời mời`);
    }
  };

  const handleResendInvitation = async (id: string, email: string) => {
    const success = await resendInvitation(id);
    if (success) {
      toast.success(`Đã gửi lại lời mời đến ${email}`);
    } else {
      toast.error(`Không thể gửi lại lời mời`);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Đã sao chép email");
  };

  const handleCopyInviteLink = (id: string) => {
    // TODO: Get actual invite link from API
    const inviteLink = `${window.location.origin}/invite/${id}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Đã sao chép liên kết mời");
  };

  const handleChangeRole = (id: string, name: string, currentRole: string) => {
    setSelectedMember({ id, name, currentRole });
    setChangeRoleModalOpen(true);
  };

  const handleManageProjects = (id: string, name: string, projectRoles?: { projectId: string }[]) => {
    const currentProjectIds = projectRoles?.map(pr => pr.projectId) || [];
    setSelectedMemberForProjects({ id, name, currentProjectIds });
    setManageProjectsModalOpen(true);
  };

  const handleRemoveMember = async (id: string, name: string) => {
    const success = await removeMember(id);
    if (success) {
      toast.success(`Đã xóa ${name} khỏi tổ chức`);
    } else {
      toast.error(`Không thể xóa ${name}`);
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
              Đang tải thành viên...
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
              <p className="font-medium">Không thể tải thành viên</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button
              onClick={() => refetch()}
              className="rounded-xl"
            >
              <RefreshCw size={16} className="mr-2" />
              Thử lại
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
            <h1 className="text-2xl font-semibold">Thành viên</h1>
            <Button
              className="shrink-0 rounded-xl bg-[#00C4AB] hover:bg-[#00B09A] text-white"
              onClick={() => setInviteModalOpen(true)}
            >
              <UserPlus size={18} className="mr-2" />
              Mời thành viên
            </Button>
          </div>
          <p className="text-muted-foreground">
            Quản lý thành viên tổ chức và lời mời
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
              Tất cả
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
              Hoạt động
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
              Chờ xử lý
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
                placeholder="Tìm theo tên hoặc email..."
                className="pl-10 rounded-xl bg-white border-border h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36 rounded-xl bg-white h-10">
                <SelectValue placeholder="Tất cả vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[280px]">Thành viên</TableHead>
                <TableHead className="w-[120px]">Vai trò</TableHead>
                <TableHead className="w-[140px]">Dự án</TableHead>
                <TableHead className="w-[100px]">Trạng thái</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="text-muted-foreground">
                      <p className="font-medium">Không tìm thấy thành viên</p>
                      <p className="text-sm">
                        Hãy điều chỉnh tìm kiếm hoặc bộ lọc
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
                            Tất cả dự án
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
                                  Dự án đã tham gia
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
                            Không có dự án
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-48 p-1">
                            {item.status === "active" ? (
                              <>
                                <button
                                  onClick={() => handleCopyEmail(item.email)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                >
                                  <Copy size={16} />
                                  Sao chép email
                                </button>
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                >
                                  <UserCircle size={16} />
                                  Xem hồ sơ
                                </button>
                                <div className="my-1 h-px bg-border" />
                                <button
                                  disabled={item.role === "owner"}
                                  onClick={() =>
                                    item.role !== "owner" && handleChangeRole(item.id, item.displayName, item.role)
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Shield size={16} />
                                  Thay đổi vai trò
                                </button>
                                {item.role === "member" && (
                                  <button
                                    onClick={() => handleManageProjects(item.id, item.displayName, item.projectRoles)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                  >
                                    <FolderKanban size={16} />
                                    Quản lý dự án
                                  </button>
                                )}
                                <div className="my-1 h-px bg-border" />
                                <button
                                  disabled={item.role === "owner"}
                                  onClick={() =>
                                    item.role !== "owner" && handleRemoveMember(item.id, item.displayName)
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <UserMinus size={16} />
                                  Xóa thành viên
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleCopyEmail(item.email)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                >
                                  <Copy size={16} />
                                  Sao chép email
                                </button>
                                <button
                                  onClick={() => handleCopyInviteLink(item.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                >
                                  <Link size={16} />
                                  Sao chép liên kết mời
                                </button>
                                <div className="my-1 h-px bg-border" />
                                <button
                                  onClick={() => handleResendInvitation(item.id, item.email)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                                >
                                  <RefreshCw size={16} />
                                  Gửi lại lời mời
                                </button>
                                <div className="my-1 h-px bg-border" />
                                <button
                                  onClick={() => handleCancelInvitation(item.id, item.email)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <X size={16} />
                                  Hủy lời mời
                                </button>
                              </>
                            )}
                          </PopoverContent>
                        </Popover>
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
          Hiển thị {filteredList.length} / {counts.all} thành viên
        </div>
      </div>

      {/* Invite Modal */}
      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInvite}
      />

      {/* Change Role Modal */}
      <ChangeRoleModal
        open={changeRoleModalOpen}
        onOpenChange={(open) => {
          setChangeRoleModalOpen(open);
          if (!open) setSelectedMember(null);
        }}
        member={selectedMember}
        onConfirm={async (newRole) => {
          if (!selectedMember) return;
          const success = await updateMemberRole(selectedMember.id, newRole);
          if (success) {
            toast.success(`Đã thay đổi vai trò của ${selectedMember.name} thành ${newRole}`);
            setChangeRoleModalOpen(false);
            setSelectedMember(null);
          } else {
            toast.error(`Không thể thay đổi vai trò`);
          }
        }}
      />

      {/* Manage Projects Modal */}
      <ManageProjectsModal
        open={manageProjectsModalOpen}
        onOpenChange={(open) => {
          setManageProjectsModalOpen(open);
          if (!open) setSelectedMemberForProjects(null);
        }}
        member={selectedMemberForProjects}
        onConfirm={async (projectIds) => {
          if (!selectedMemberForProjects) return;
          const success = await updateMemberProjects(selectedMemberForProjects.id, projectIds);
          if (success) {
            toast.success(`Đã cập nhật dự án cho ${selectedMemberForProjects.name}`);
            setManageProjectsModalOpen(false);
            setSelectedMemberForProjects(null);
          } else {
            toast.error(`Không thể cập nhật dự án`);
          }
        }}
      />
    </>
  );
}
