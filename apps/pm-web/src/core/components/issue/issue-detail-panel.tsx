"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Eye, Lock, Pin, Plus, X, Info } from "lucide-react";
import { Badge, Button, Input } from "@uts/design-system/ui";
import {
  LiteTextEditorWithRef,
  type EditorRefApi,
  type TExtensions,
  type TFileHandler,
  type TMentionHandler,
} from "@uts/design-system/editor";

import { IIssue } from "@/core/types/issue";
import {
  ISSUE_PRIORITY_BADGE_VARIANT,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATE_BADGE_VARIANT,
  ISSUE_STATE_LABELS,
  ISSUE_TYPE_BADGE_VARIANT,
  ISSUE_TYPE_LABELS,
  formatDate,
  formatIssueKey,
} from "@/core/components/backlog/utils";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const convertPlainTextToHtml = (value: string | null | undefined): string => {
  if (!value) return "";
  const escaped = escapeHtml(value);
  return `<p>${escaped.replace(/\r?\n/g, "<br />")}</p>`;
};

const decodeHtmlEntities = (value: string): string => {
  if (typeof window === "undefined") {
    return value
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const htmlToPlainText = (value: string | null | undefined): string => {
  if (!value) return "";
  const withLineBreaks = value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/div>\s*<div>/gi, "\n\n");
  const withoutTags = withLineBreaks.replace(/<\/?[^>]+(>|$)/g, "");
  return decodeHtmlEntities(withoutTags)
    .replace(/\u00a0/g, " ")
    .trim();
};

const normalizeEditorHtml = (value: string | null | undefined): string =>
  (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();

export interface IssueDetailPanelProps {
  issue: IIssue;
  projectIdentifier?: string | null;
  locationLabel?: string | null;
  onClose: () => void;
  onUpdateIssue?: (issueId: string, data: Partial<IIssue>) => Promise<void>;
}

export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = (props) => {
  const { issue, projectIdentifier, locationLabel, onClose, onUpdateIssue } = props;

  const issueKey = formatIssueKey(projectIdentifier, issue.sequenceId);
  const formattedStartDate = formatDate(issue.startDate);
  const formattedDueDate = formatDate(issue.targetDate);
  const formattedCreatedAt = formatDate(issue.createdAt);
  const formattedUpdatedAt = formatDate(issue.updatedAt);

  const sprintLabel = useMemo(() => {
    if (issue.sprintId) {
      return locationLabel ?? "Không xác định";
    }
    return locationLabel ?? "Backlog";
  }, [issue.sprintId, locationLabel]);

  const descriptionContent = issue.descriptionHtml || issue.description || null;

  const editorRef = useRef<EditorRefApi | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const initialEditorValue = useMemo(() => {
    if (issue.descriptionHtml && issue.descriptionHtml.trim().length > 0) {
      return issue.descriptionHtml;
    }
    if (issue.description && issue.description.trim().length > 0) {
      return convertPlainTextToHtml(issue.description);
    }
    return "";
  }, [issue.description, issue.descriptionHtml, issue.id]);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraftHtml, setDescriptionDraftHtml] = useState(initialEditorValue);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(issue.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    setDescriptionDraftHtml(initialEditorValue);
    setIsEditingDescription(false);
  }, [initialEditorValue, issue.id]);

  useEffect(() => {
    if (!isEditingDescription) return;
    const timer = window.setTimeout(() => {
      if (!editorRef.current) return;
      editorRef.current.setEditorValue(initialEditorValue, false);
      editorRef.current.focus?.("end");
    }, 40);

    return () => window.clearTimeout(timer);
  }, [isEditingDescription, initialEditorValue]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      const timer = window.setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 16);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isEditingName]);

  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(issue.name);
      setNameError(null);
    }
  }, [issue.name, issue.id, isEditingName]);

  const disabledDescriptionExtensions = useMemo<TExtensions[]>(
    () => ["ai", "collaboration-cursor", "issue-embed", "slash-commands", "image"],
    []
  );
  const flaggedDescriptionExtensions = useMemo<TExtensions[]>(() => [], []);

  const fileHandler = useMemo<TFileHandler>(() => {
    const assetsUploadStatus: Record<string, number> = {};
    return {
      assetsUploadStatus,
      cancel: () => undefined,
      checkIfAssetExists: async () => false,
      delete: async () => Promise.resolve(),
      getAssetDownloadSrc: async (path: string) => path,
      getAssetSrc: async (path: string) => path,
      restore: async () => Promise.resolve(),
      upload: async () => Promise.reject(new Error("Upload không được hỗ trợ trong mô tả.")),
      validation: { maxFileSize: 10 * 1024 * 1024 },
    };
  }, []);

  const mentionHandler = useMemo<TMentionHandler>(
    () => ({
      renderComponent: () => null,
      searchCallback: async () => [],
      getMentionedEntityDetails: () => ({ display_name: "" }),
    }),
    []
  );

  const hasDescriptionChanges = useMemo(
    () => normalizeEditorHtml(descriptionDraftHtml) !== normalizeEditorHtml(initialEditorValue),
    [descriptionDraftHtml, initialEditorValue]
  );

  const handleStartEditingDescription = useCallback(() => {
    if (isEditingDescription) return;
    setDescriptionDraftHtml(initialEditorValue);
    setIsEditingDescription(true);
  }, [initialEditorValue, isEditingDescription]);

  const handleDescriptionChange = useCallback((_: unknown, html: string) => {
    setDescriptionDraftHtml(html ?? "");
  }, []);

  const handleCancelDescriptionEdit = useCallback(() => {
    setIsEditingDescription(false);
    setDescriptionDraftHtml(initialEditorValue);
    if (editorRef.current) {
      editorRef.current.setEditorValue(initialEditorValue, false);
      editorRef.current.blur?.();
    }
  }, [initialEditorValue]);

  const handleSaveDescription = useCallback(async () => {
    if (!onUpdateIssue) {
      setIsEditingDescription(false);
      return;
    }
    if (!hasDescriptionChanges) {
      setIsEditingDescription(false);
      return;
    }

    const editorDocument = editorRef.current?.getDocument();
    const rawHtml = editorDocument?.html ?? descriptionDraftHtml ?? "";
    const cleanedHtml = rawHtml.trim();
    const plainText = htmlToPlainText(cleanedHtml);
    const isEmpty = plainText.length === 0;
    const nextHtml = isEmpty ? null : cleanedHtml;
    const nextDescription = isEmpty ? null : plainText;

    setIsSavingDescription(true);
    try {
      await onUpdateIssue(issue.id, {
        description: nextDescription,
        descriptionHtml: nextHtml,
      });
      setIsEditingDescription(false);
    } catch (error) {
      console.error("Không thể cập nhật mô tả:", error);
    } finally {
      setIsSavingDescription(false);
    }
  }, [onUpdateIssue, hasDescriptionChanges, issue.id, descriptionDraftHtml]);

  const saveDescriptionDisabled = !onUpdateIssue || isSavingDescription || !hasDescriptionChanges;

  const handleStartEditingName = useCallback(() => {
    if (!onUpdateIssue) return;
    setNameDraft(issue.name);
    setNameError(null);
    setIsEditingName(true);
  }, [issue.name, onUpdateIssue]);

  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false);
    setNameDraft(issue.name);
    setNameError(null);
  }, [issue.name]);

  const handleChangeNameDraft = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setNameDraft(event.target.value);
    if (event.target.value.trim().length > 0) {
      setNameError(null);
    }
  }, []);

  const handleSaveName = useCallback(async () => {
    if (!onUpdateIssue) {
      setIsEditingName(false);
      return;
    }
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError("Tên công việc là bắt buộc");
      return;
    }
    if (trimmed === issue.name.trim()) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      await onUpdateIssue(issue.id, { name: trimmed });
      setIsEditingName(false);
      setNameDraft(trimmed);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? "Không thể cập nhật tên công việc. Vui lòng thử lại.";
      setNameError(typeof message === "string" ? message : "Không thể cập nhật tên công việc. Vui lòng thử lại.");
    } finally {
      setIsSavingName(false);
    }
  }, [issue.id, issue.name, nameDraft, onUpdateIssue]);

  const handleSubmitName = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void handleSaveName();
    },
    [handleSaveName]
  );

  const handleNameKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCancelEditName();
      }
    },
    [handleCancelEditName]
  );

  const iconButtonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-md text-custom-text-300 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100";

  const renderAssignees = () => {
    if (!issue.assignees.length) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {issue.assignees.map((assignee, index) => (
          <div
            key={`${assignee}-${index}`}
            className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-2 py-1"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-custom-primary-100 text-xs font-semibold text-white">
              {(assignee || "U").charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-custom-text-100">{assignee || "Người dùng"}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailValue = (value: React.ReactNode | null | undefined) => {
    if (value === null || value === undefined) {
      return <span className="text-sm text-custom-text-300">Không có</span>;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? (
        <span className="text-sm text-custom-text-100">{trimmed}</span>
      ) : (
        <span className="text-sm text-custom-text-300">Không có</span>
      );
    }

    if (Array.isArray(value) && value.length === 0) {
      return <span className="text-sm text-custom-text-300">Không có</span>;
    }

    return <>{value}</>;
  };

  const DetailField: React.FC<{ label: string; value: React.ReactNode | null | undefined }> = ({ label, value }) => (
    <div className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-custom-text-300">{label}</span>
      <div className="text-sm text-custom-text-100">{renderDetailValue(value)}</div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-custom-background-100">
      <div className="flex items-center justify-between border-b border-custom-border-200 px-5 py-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase text-custom-text-300">Chi tiết công việc</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-custom-text-100">{issueKey}</span>
            {locationLabel ? (
              <Badge variant="outline-neutral" size="sm" className="flex gap-1">
                <CalendarDays className="size-3" />
                {locationLabel}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" className={iconButtonClass} title="Người theo dõi">
            <Eye className="size-4" />
          </button>
          <button type="button" className={iconButtonClass} title="Quyền truy cập">
            <Lock className="size-4" />
          </button>
          <button type="button" className={iconButtonClass} onClick={onClose} title="Đóng chi tiết">
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-3">
              {isEditingName ? (
                <form onSubmit={handleSubmitName} className="space-y-2">
                  <Input
                    ref={nameInputRef}
                    value={nameDraft}
                    onChange={handleChangeNameDraft}
                    onKeyDown={handleNameKeyDown}
                    disabled={isSavingName}
                    className="w-full text-xl font-semibold"
                    placeholder="Nhập tên công việc"
                  />
                  {nameError ? <p className="text-sm text-red-500">{nameError}</p> : null}
                  <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" variant="primary" disabled={isSavingName}>
                      {isSavingName ? "Đang lưu..." : "Lưu"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="neutral-primary"
                      disabled={isSavingName}
                      onClick={handleCancelEditName}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={handleStartEditingName}
                    title={onUpdateIssue ? "Nhấp để chỉnh sửa tên" : undefined}
                    disabled={!onUpdateIssue}
                  >
                    <h2 className="text-xl font-semibold text-custom-text-100 hover:underline">
                      {issue.name || "Không có tiêu đề"}
                    </h2>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={ISSUE_STATE_BADGE_VARIANT[issue.state]} size="sm">
                      {ISSUE_STATE_LABELS[issue.state]}
                    </Badge>
                    <Badge variant={ISSUE_PRIORITY_BADGE_VARIANT[issue.priority]} size="sm">
                      {ISSUE_PRIORITY_LABELS[issue.priority]}
                    </Badge>
                    <Badge variant={ISSUE_TYPE_BADGE_VARIANT[issue.type]} size="sm">
                      {ISSUE_TYPE_LABELS[issue.type]}
                    </Badge>
                  </div>
                  <p className="text-xs text-custom-text-300">
                    Cập nhật lần cuối {formattedUpdatedAt ?? "chưa xác định"}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="neutral-primary"
              size="sm"
              className="gap-2"
              disabled
              title="Tính năng tạo công việc con đang được phát triển"
            >
              <Plus className="size-4" />
              Công việc con
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-custom-text-300">Mô tả</h3>
            {!isEditingDescription ? (
              <Button
                type="button"
                variant="link-neutral"
                size="sm"
                className="text-custom-text-300 hover:text-custom-text-200"
                onClick={handleStartEditingDescription}
              >
                Chỉnh sửa
              </Button>
            ) : null}
          </div>
          {isEditingDescription ? (
            <div className="space-y-3">
              <LiteTextEditorWithRef
                key={issue.id}
                ref={editorRef}
                id={`issue-description-${issue.id}`}
                editable
                initialValue={initialEditorValue}
                disabledExtensions={disabledDescriptionExtensions}
                flaggedExtensions={flaggedDescriptionExtensions}
                fileHandler={fileHandler}
                mentionHandler={mentionHandler}
                onChange={handleDescriptionChange}
                placeholder="Nhập mô tả cho công việc này..."
                containerClassName="border border-custom-border-200 rounded-md bg-custom-background-90 p-4 !text-sm"
                editorClassName="min-h-[160px] !text-sm leading-6"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={handleSaveDescription}
                  disabled={saveDescriptionDisabled}
                >
                  {isSavingDescription ? "Đang lưu..." : "Lưu"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="neutral-primary"
                  onClick={handleCancelDescriptionEdit}
                  disabled={isSavingDescription}
                >
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              className="min-h-[84px] w-full rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:border-custom-border-200 hover:bg-custom-background-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100 focus-visible:ring-offset-1 focus-visible:ring-offset-custom-background-100"
              onClick={handleStartEditingDescription}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleStartEditingDescription();
                }
              }}
            >
              {descriptionContent ? (
                issue.descriptionHtml ? (
                  <div
                    className="text-sm leading-6 text-custom-text-200 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p:last-child]:mb-0"
                    dangerouslySetInnerHTML={{ __html: issue.descriptionHtml }}
                  />
                ) : (
                  <p className="whitespace-pre-line text-sm leading-6 text-custom-text-200">{issue.description}</p>
                )
              ) : (
                <span className="text-sm italic text-custom-text-300">Nhấp để thêm mô tả...</span>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-90 px-4 py-4">
          <div className="flex items-start gap-3">
            <Pin className="mt-1 size-4 text-custom-text-300" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-custom-text-200">Trường ghim</p>
              <p className="text-custom-text-300">
                Nhấp vào biểu tượng ghim bên cạnh một trường trong danh sách chi tiết để ghim trường đó tại đây.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-custom-border-200 bg-custom-background-90">
          <div className="flex items-center justify-between border-b border-custom-border-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-custom-text-200">Thông tin</h3>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-custom-text-300 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100"
              title="Tùy chỉnh trường"
            >
              <Info className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
            <DetailField label="Người thực hiện" value={renderAssignees()} />
            <DetailField label="Trạng thái" value={ISSUE_STATE_LABELS[issue.state]} />
            <DetailField label="Ưu tiên" value={ISSUE_PRIORITY_LABELS[issue.priority]} />
            <DetailField label="Loại" value={ISSUE_TYPE_LABELS[issue.type]} />
            <DetailField label="Sprint" value={issue.sprintId ? sprintLabel : (locationLabel ?? "Không có")} />
            <DetailField label="Ngày bắt đầu" value={formattedStartDate} />
            <DetailField label="Hạn hoàn thành" value={formattedDueDate} />
            <DetailField label="Story point" value={issue.point !== null ? issue.point : null} />
            <DetailField label="Ngày tạo" value={formattedCreatedAt} />
            <DetailField label="Cập nhật cuối" value={formattedUpdatedAt} />
          </div>
        </section>
      </div>
    </div>
  );
};
