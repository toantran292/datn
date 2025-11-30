"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Users, Signal, User, Calendar, CalendarClock, Tag, Network, Hash } from "lucide-react";
import { Badge } from "@uts/design-system/ui";
import { IIssue } from "@/core/types/issue";
import { useIssueStatus } from "@/core/hooks/store/use-issue-status";
import { IdentityService } from "@/core/services/identity/identity.service";
import { ProjectService } from "@/core/services/project/project.service";
import {
  ISSUE_PRIORITY_BADGE_VARIANT,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATE_BADGE_VARIANT,
  ISSUE_STATE_LABELS,
  ISSUE_TYPE_BADGE_VARIANT,
  ISSUE_TYPE_LABELS,
  formatDate,
} from "@/core/components/backlog/utils";

interface IssueDetailPropertiesProps {
  issue: IIssue;
  locationLabel?: string | null;
  disabled?: boolean;
  onUpdateIssue?: (issueId: string, data: Partial<IIssue>) => Promise<void>;
}

export const IssueDetailProperties: React.FC<IssueDetailPropertiesProps> = ({
  issue,
  locationLabel,
  disabled = false,
  onUpdateIssue,
}) => {
  const [assignees, setAssignees] = useState<string[]>(issue.assignees ?? []);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const identityService = useMemo(() => new IdentityService(), []);
  const projectService = useMemo(() => new ProjectService(), []);
  const issueStatusStore = useIssueStatus();
  const status = issueStatusStore.getIssueStatusById(issue.statusId);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loader = issueStatusStore.getLoaderForProject(issue.projectId);
    if (loader === "init-loader") {
      issueStatusStore.fetchIssueStatusesByProject(issue.projectId).catch((error) => {
        console.error("Failed to load statuses for properties:", error);
      });
    }
  }, [issue.projectId, issueStatusStore]);

  useEffect(() => {
    setAssignees(issue.assignees ?? []);
  }, [issue.assignees]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadOrg = async () => {
      try {
        const project = await projectService.getProjectById(issue.projectId);
        setOrgId(project.orgId);
      } catch (error) {
        console.error("Failed to load project for assignees:", error);
      }
    };
    loadOrg();
  }, [issue.projectId, projectService]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!orgId) return;
      setIsLoadingMembers(true);
      try {
        const res = await identityService.getOrgMembers(orgId, 0, 200);
        setMembers(res.items?.map((m) => ({ id: m.id, name: m.display_name || m.email || "User" })) ?? []);
      } catch (error) {
        console.error("Failed to load members for assignees:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    loadMembers();
  }, [identityService, orgId]);

  const handleAssigneesChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map((opt) => opt.value);
    setAssignees(selected);

    if (onUpdateIssue) {
      try {
        await onUpdateIssue(issue.id, { assignees: selected });
      } catch (error) {
        console.error("Failed to update assignees:", error);
      }
    }
  };

  const toggleAssignee = (memberId: string) => {
    const exists = assignees.includes(memberId);
    const next = exists ? assignees.filter((id) => id !== memberId) : [...assignees, memberId];
    setAssignees(next);
    if (onUpdateIssue) {
      onUpdateIssue(issue.id, { assignees: next }).catch((error) =>
        console.error("Failed to update assignees:", error)
      );
    }
  };

  const filteredMembers = members.filter((member) => member.name.toLowerCase().includes(assigneeSearch.toLowerCase()));

  const renderAssigneePills = () =>
    assignees.length === 0 ? (
      <span className="text-sm text-custom-text-400">Add assignees</span>
    ) : (
      <div className="flex flex-wrap gap-1">
        {assignees.map((id) => (
          <span key={id} className="rounded bg-custom-primary-50 px-2 py-0.5 text-xs text-custom-text-100">
            {members.find((m) => m.id === id)?.name ?? id}
          </span>
        ))}
      </div>
    );

  const formattedStartDate = formatDate(issue.startDate);
  const formattedDueDate = formatDate(issue.targetDate);
  const formattedCreatedAt = formatDate(issue.createdAt);

  const sprintLabel = issue.sprintId ? (locationLabel ?? "Không xác định") : (locationLabel ?? "Backlog");

  const renderAssignees = () => {
    if (!issue.assignees.length) {
      return <span className="text-sm text-custom-text-400">Add assignees</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {issue.assignees.map((assignee, index) => (
          <div
            key={`${assignee}-${index}`}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-primary-100 text-xs font-semibold text-white"
          >
            {(assignee || "U").charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h6 className="text-sm font-medium">Properties</h6>
      <div className={`w-full space-y-2 mt-3 ${disabled ? "opacity-60" : ""}`}>
        {/* status */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Circle className="h-4 w-4 flex-shrink-0" />
            <span>Status</span>
          </div>
          <div className="w-3/4 flex-grow">
            <Badge
              variant={ISSUE_STATE_BADGE_VARIANT[issue.state]}
              size="sm"
              style={status?.color ? { backgroundColor: status.color, color: "#fff", borderColor: status.color } : {}}
            >
              {status?.name ?? ISSUE_STATE_LABELS[issue.state]}
            </Badge>
          </div>
        </div>

        {/* assignee */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>Assignees</span>
          </div>
          <div className="w-3/4 flex-grow">
            {disabled ? (
              renderAssignees()
            ) : (
              <div className="relative" ref={assigneeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsAssigneeOpen((prev) => !prev)}
                  className="flex w-full items-center gap-2 rounded  px-2 py-1 text-sm hover:bg-custom-background-80 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 text-left">
                    {assignees.length === 0 ? (
                      <span className="text-custom-text-400">Add assignees</span>
                    ) : (
                      assignees.map((id) => {
                        const name = members.find((m) => m.id === id)?.name ?? id;
                        const initial = name.charAt(0).toUpperCase();
                        return (
                          <span
                            key={id}
                            className="flex items-center gap-2 rounded-full bg-custom-background-100 px-2 py-1 text-xs text-custom-text-100 shadow-sm"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-custom-primary-100 text-[11px] font-semibold text-white">
                              {initial}
                            </span>
                            <span className="text-sm text-custom-text-200">{name}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </button>

                {isAssigneeOpen && (
                  <div className="absolute z-20 mt-1 w-64 rounded-md border border-custom-border-200 bg-custom-background-100 shadow-lg">
                    <div className="border-b border-custom-border-200 p-2">
                      <input
                        type="text"
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        placeholder="Tìm kiếm thành viên..."
                        className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto p-2 space-y-1">
                      {isLoadingMembers ? (
                        <div className="text-xs text-custom-text-400">Đang tải thành viên...</div>
                      ) : filteredMembers.length === 0 ? (
                        <div className="text-xs text-custom-text-400">Không tìm thấy thành viên</div>
                      ) : (
                        filteredMembers.map((member) => {
                          const checked = assignees.includes(member.id);
                          return (
                            <label
                              key={member.id}
                              className="flex items-center justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-custom-background-80 cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-custom-primary-100 text-[11px] text-white">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="truncate">{member.name}</span>
                              </span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAssignee(member.id)}
                                className="accent-custom-primary-100"
                              />
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* priority */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Signal className="h-4 w-4 flex-shrink-0" />
            <span>Priority</span>
          </div>
          <div className="w-3/4 flex-grow">
            <Badge variant={ISSUE_PRIORITY_BADGE_VARIANT[issue.priority]} size="sm">
              {ISSUE_PRIORITY_LABELS[issue.priority]}
            </Badge>
          </div>
        </div>

        {/* created by */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <User className="h-4 w-4 flex-shrink-0" />
            <span>Created by</span>
          </div>
          <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm justify-between cursor-not-allowed">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-primary-100 text-xs font-semibold text-white">
              U
            </div>
            <span className="flex-grow truncate leading-5">User</span>
          </div>
        </div>

        {/* start date */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Start date</span>
          </div>
          <div className="w-3/4 flex-grow">
            {formattedStartDate ? (
              <span className="text-sm">{formattedStartDate}</span>
            ) : (
              <span className="text-sm text-custom-text-400">Add start date</span>
            )}
          </div>
        </div>

        {/* due date */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <CalendarClock className="h-4 w-4 flex-shrink-0" />
            <span>Due date</span>
          </div>
          <div className="flex items-center gap-2">
            {formattedDueDate ? (
              <span className="text-sm">{formattedDueDate}</span>
            ) : (
              <span className="text-sm text-custom-text-400">Add due date</span>
            )}
          </div>
        </div>

        {/* parent */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Network className="h-4 w-4 flex-shrink-0" />
            <span>Parent</span>
          </div>
          <div className="w-3/4 flex-grow">
            <span className="text-sm text-custom-text-400">Add parent work item</span>
          </div>
        </div>

        {/* label */}
        <div className="flex w-full items-center gap-3 min-h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Tag className="h-4 w-4 flex-shrink-0" />
            <span>Labels</span>
          </div>
          <div className="flex w-full flex-col gap-3 truncate">
            <span className="text-sm text-custom-text-400">Select label</span>
          </div>
        </div>
      </div>
    </div>
  );
};
