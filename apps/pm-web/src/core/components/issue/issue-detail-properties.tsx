"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Users, Signal, User, Calendar, CalendarClock, Network, Hash } from "lucide-react";
import { Badge } from "@uts/design-system/ui";
import { IIssue } from "@/core/types/issue";
import { useIssueStatus } from "@/core/hooks/store/use-issue-status";
import { IdentityService } from "@/core/services/identity/identity.service";
import { ProjectService } from "@/core/services/project/project.service";
import { useIssue } from "@/core/hooks/store/use-issue";
import { formatIssueKey } from "@/core/components/backlog/utils";
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
  projectIdentifier?: string | null;
  workspaceSlug?: string | null;
}

type TMemberInfo = { id: string; name: string; email?: string };

export const IssueDetailProperties: React.FC<IssueDetailPropertiesProps> = ({
  issue,
  locationLabel,
  disabled = false,
  onUpdateIssue,
  projectIdentifier = null,
  workspaceSlug = null,
}) => {
  const [assignees, setAssignees] = useState<string[]>(issue.assignees ?? []);
  const [members, setMembers] = useState<TMemberInfo[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isParentOpen, setIsParentOpen] = useState(false);
  const identityService = useMemo(() => new IdentityService(), []);
  const projectService = useMemo(() => new ProjectService(), []);
  const issueStatusStore = useIssueStatus();
  const issueStore = useIssue();
  const status = issueStatusStore.getIssueStatusById(issue.statusId);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const parentDropdownRef = useRef<HTMLDivElement>(null);

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
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setIsPriorityOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
      if (parentDropdownRef.current && !parentDropdownRef.current.contains(event.target as Node)) {
        setIsParentOpen(false);
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
        setMembers(
          res.items?.map((m) => ({
            id: m.id,
            name: m.display_name || m.email || "User",
            email: m.email,
          })) ?? []
        );
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

  const filteredMembers = members.filter((member) => {
    const haystack = `${member.name} ${member.email ?? ""}`.toLowerCase();
    return haystack.includes(assigneeSearch.toLowerCase());
  });

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

  const PRIORITY_OPTIONS: { value: IIssue["priority"]; label: string }[] = [
    { value: "LOW", label: ISSUE_PRIORITY_LABELS.LOW },
    { value: "MEDIUM", label: ISSUE_PRIORITY_LABELS.MEDIUM },
    { value: "HIGH", label: ISSUE_PRIORITY_LABELS.HIGH },
    { value: "CRITICAL", label: ISSUE_PRIORITY_LABELS.CRITICAL },
  ];

  const statusOptions = issueStatusStore.getIssueStatusesForProject(issue.projectId);
  const issueOptions = issueStore
    .getIssuesForProject(issue.projectId)
    .filter((i) => i.id !== issue.id)
    .sort((a, b) => a.sequenceId - b.sequenceId);

  const formattedStartDate = formatDate(issue.startDate);
  const formattedDueDate = formatDate(issue.targetDate);
  const formattedCreatedAt = formatDate(issue.createdAt);

  const sprintLabel = issue.sprintId ? (locationLabel ?? "Không xác định") : (locationLabel ?? "Backlog");
  const creator = members.find((m) => m.id === issue.createdBy);
  const creatorDisplay = creator?.name || creator?.email || issue.createdBy || "User";
  const creatorInitial = creatorDisplay.charAt(0).toUpperCase();
  const [startDateValue, setStartDateValue] = useState<string | null>(issue.startDate);
  const [dueDateValue, setDueDateValue] = useState<string | null>(issue.targetDate);
  const [parentValue, setParentValue] = useState<string | null>(issue.parentId);

  useEffect(() => {
    setStartDateValue(issue.startDate);
    setDueDateValue(issue.targetDate);
    setParentValue(issue.parentId);
  }, [issue.startDate, issue.targetDate, issue.parentId]);

  const handleStartDateChange = async (value: string) => {
    const next = value || null;
    setStartDateValue(next);
    if (onUpdateIssue) {
      try {
        await onUpdateIssue(issue.id, { startDate: next });
      } catch (error) {
        console.error("Failed to update start date:", error);
        setStartDateValue(issue.startDate);
      }
    }
  };

  const handleDueDateChange = async (value: string) => {
    const next = value || null;
    setDueDateValue(next);
    if (onUpdateIssue) {
      try {
        await onUpdateIssue(issue.id, { targetDate: next });
      } catch (error) {
        console.error("Failed to update due date:", error);
        setDueDateValue(issue.targetDate);
      }
    }
  };

  const handleParentChange = async (parentId: string | null) => {
    setParentValue(parentId);
    if (onUpdateIssue) {
      try {
        await onUpdateIssue(issue.id, { parentId });
      } catch (error) {
        console.error("Failed to update parent:", error);
        setParentValue(issue.parentId);
      }
    }
  };

  const childIssues = issueStore.getIssuesForProject(issue.projectId).filter((i) => i.parentId === issue.id);
  const childIssueKey = (child: IIssue) => formatIssueKey(projectIdentifier || null, child.sequenceId);
  const handleOpenChild = (child: IIssue) => {
    const resolvedWorkspaceSlug =
      workspaceSlug ??
      (() => {
        if (typeof window === "undefined") return "";
        const parts = window.location.pathname.split("/").filter(Boolean);
        return parts[0] ?? "";
      })();
    const workspaceSegment = resolvedWorkspaceSlug ? `/${resolvedWorkspaceSlug}` : "";
    const path = `${workspaceSegment}/project/${issue.projectId}/issue/${child.id}`;
    window.open(path, "_self");
  };

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
            {disabled ? (
              <Badge
                variant={ISSUE_STATE_BADGE_VARIANT[issue.state]}
                size="sm"
                style={status?.color ? { backgroundColor: status.color, color: "#fff", borderColor: status.color } : {}}
              >
                {status?.name ?? ISSUE_STATE_LABELS[issue.state]}
              </Badge>
            ) : (
              <div className="relative" ref={statusDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsStatusOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-custom-background-80 transition-colors w-full"
                >
                  <Badge
                    variant={ISSUE_STATE_BADGE_VARIANT[issue.state]}
                    size="sm"
                    style={status?.color ? { backgroundColor: status.color, color: "#fff", borderColor: status.color } : {}}
                  >
                    {status?.name ?? ISSUE_STATE_LABELS[issue.state]}
                  </Badge>
                </button>
                {isStatusOpen && (
                  <div className="absolute z-20 mt-1 w-56 rounded-md border border-custom-border-200 bg-custom-background-100 shadow-lg">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.id}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => {
                          setIsStatusOpen(false);
                          onUpdateIssue?.(issue.id, { statusId: opt.id });
                        }}
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full border border-custom-border-200"
                          style={{ backgroundColor: opt.color }}
                        />
                        <span className="truncate">{opt.name}</span>
                      </button>
                    ))}
                    {statusOptions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-custom-text-400">Chưa có trạng thái</div>
                    )}
                  </div>
                )}
              </div>
            )}
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
            {disabled ? (
              <Badge variant={ISSUE_PRIORITY_BADGE_VARIANT[issue.priority]} size="sm">
                {ISSUE_PRIORITY_LABELS[issue.priority]}
              </Badge>
            ) : (
              <div className="relative" ref={priorityDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsPriorityOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-custom-background-80 transition-colors w-full"
                >
                  <Badge variant={ISSUE_PRIORITY_BADGE_VARIANT[issue.priority]} size="sm">
                    {ISSUE_PRIORITY_LABELS[issue.priority]}
                  </Badge>
                </button>
                {isPriorityOpen && (
                  <div className="absolute z-20 mt-1 w-40 rounded-md border border-custom-border-200 bg-custom-background-100 shadow-lg">
                    {PRIORITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => {
                          setIsPriorityOpen(false);
                          onUpdateIssue?.(issue.id, { priority: option.value });
                        }}
                      >
                        <Badge variant={ISSUE_PRIORITY_BADGE_VARIANT[option.value]} size="sm">
                          {option.label}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              {creatorInitial}
            </div>
            <span className="flex-grow truncate leading-5">{creatorDisplay}</span>
          </div>
        </div>

        {/* start date */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Start date</span>
          </div>
          <div className="w-3/4 flex-grow">
            {disabled ? (
              formattedStartDate ? (
                <span className="text-sm">{formattedStartDate}</span>
              ) : (
                <span className="text-sm text-custom-text-400">Add start date</span>
              )
            ) : (
              <input
                type="date"
                value={startDateValue ?? ""}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-sm text-custom-text-200 focus:outline-none focus:ring-1 focus:ring-custom-primary-100"
                placeholder="Add start date"
              />
            )}
          </div>
        </div>

        {/* due date */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <CalendarClock className="h-4 w-4 flex-shrink-0" />
            <span>Due date</span>
          </div>
          <div className="w-3/4 flex-grow">
            {disabled ? (
              formattedDueDate ? (
                <span className="text-sm">{formattedDueDate}</span>
              ) : (
                <span className="text-sm text-custom-text-400">Add due date</span>
              )
            ) : (
              <input
                type="date"
                value={dueDateValue ?? ""}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-sm text-custom-text-200 focus:outline-none focus:ring-1 focus:ring-custom-primary-100"
                placeholder="Add due date"
              />
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
            {disabled ? (
              parentValue ? (
                <span className="text-sm text-custom-text-100">
                  {issueOptions.find((i) => i.id === parentValue)?.name ?? parentValue}
                </span>
              ) : (
                <span className="text-sm text-custom-text-400">Add parent work item</span>
              )
            ) : (
              <div className="relative" ref={parentDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsParentOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded px-2 py-1 text-sm hover:bg-custom-background-80 transition-colors"
                >
                  <span className="truncate text-custom-text-200">
                    {parentValue
                      ? issueOptions.find((i) => i.id === parentValue)?.name ?? parentValue
                      : "Add parent work item"}
                  </span>
                  <Hash className="h-4 w-4 text-custom-text-300" />
                </button>
                {isParentOpen && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-custom-border-200 bg-custom-background-100 shadow-lg">
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-custom-text-200 hover:bg-custom-background-80"
                      onClick={() => {
                        setIsParentOpen(false);
                        handleParentChange(null);
                      }}
                    >
                      (None)
                    </button>
                    {issueOptions.map((opt) => (
                      <button
                        key={opt.id}
                        className="w-full px-3 py-2 text-left text-sm text-custom-text-200 hover:bg-custom-background-80"
                        onClick={() => {
                          setIsParentOpen(false);
                          handleParentChange(opt.id);
                        }}
                      >
                        {opt.name}
                      </button>
                    ))}
                    {issueOptions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-custom-text-400">No other work items</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* children list */}
        {childIssues.length > 0 && (
          <div className="flex w-full items-start gap-3">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <Hash className="h-4 w-4 flex-shrink-0" />
              <span>Subtasks</span>
            </div>
            <div className="w-3/4 flex-grow">
              <div className="flex flex-col gap-1">
                {childIssues.map((child) => (
                  <button
                    key={child.id}
                    className="flex items-center justify-between rounded px-2 py-1 text-sm text-custom-text-200 hover:bg-custom-background-80"
                    onClick={() => handleOpenChild(child)}
                  >
                    <span className="truncate">{child.name}</span>
                    <span className="text-xs text-custom-text-300">{childIssueKey(child)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
