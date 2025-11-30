"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import {
  LiteTextEditorWithRef,
  type EditorRefApi,
  type TExtensions,
  type TFileHandler,
  type TMentionHandler,
} from "@uts/design-system/editor";
import { IdentityService } from "@/core/services/identity/identity.service";
import { ProjectService } from "@/core/services/project/project.service";
import { Avatar } from "@uts/design-system/ui";

interface IssueDescriptionProps {
  issueId: string;
  projectId?: string;
  initialValue?: string;
  disabled?: boolean;
  onSubmit?: (value: string) => Promise<void>;
  containerClassName?: string;
}

const convertPlainTextToHtml = (value: string | null | undefined): string => {
  if (!value) return "";
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const escaped = escapeHtml(value);
  return `<p>${escaped.replace(/\r?\n/g, "<br />")}</p>`;
};

export const IssueDescription: React.FC<IssueDescriptionProps> = ({
  issueId,
  projectId,
  initialValue = "",
  disabled = false,
  onSubmit,
  containerClassName = "",
}) => {
  const editorRef = useRef<EditorRefApi | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const identityService = useMemo(() => new IdentityService(), []);
  const projectService = useMemo(() => new ProjectService(), []);

  const editorValue = useMemo(() => {
    if (!initialValue || initialValue.trim().length === 0) return "<p></p>";
    // If it's already HTML
    if (initialValue.includes("<")) return initialValue;
    // Convert plain text to HTML
    return convertPlainTextToHtml(initialValue);
  }, [initialValue, issueId]);

  const lastSavedValueRef = useRef<string>(editorValue);

  useEffect(() => {
    lastSavedValueRef.current = editorValue;
  }, [editorValue]);

  const disabledExtensions = useMemo<TExtensions[]>(
    () => ["ai", "collaboration-cursor", "issue-embed", "slash-commands", "image"],
    []
  );

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

  useEffect(() => {
    const loadOrg = async () => {
      if (!projectId) return;
      try {
        const project = await projectService.getProjectById(projectId);
        setOrgId(project.orgId);
      } catch (error) {
        console.error("Failed to load project for mentions:", error);
      }
    };
    loadOrg();
  }, [projectId, projectService]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!orgId) return;
      try {
        const res = await identityService.getOrgMembers(orgId, 0, 200);
        const mappedMembers =
          res.items?.map((m) => ({
            id: m.id,
            name: m.display_name || m.email || "User",
          })) ?? [];
        setMembers(mappedMembers);
        setMembersLoaded(true);
      } catch (error) {
        console.error("Failed to load members for mentions:", error);
        setMembersLoaded(true); // Still mark as loaded even on error
      }
    };
    loadMembers();
  }, [identityService, orgId]);

  const mentionHandler = useMemo<TMentionHandler>(() => {
    const toSuggestion = (member: { id: string; name: string }) => ({
      id: member.id,
      title: member.name,
      entity_identifier: member.id,
      entity_name: "user_mention" as const,
      icon: <Avatar name={member.name} size="sm" />,
    });

    return {
      searchCallback: async (query: string) => {
        const q = query?.toLowerCase?.() ?? "";
        const list = !q ? members : members.filter((m) => m.name.toLowerCase().includes(q));
        return [
          {
            key: "users",
            title: "Users",
            items: list.map(toSuggestion),
          },
        ];
      },
      renderComponent: (props: { entity_identifier: string; entity_name: string }) => {
        // Đơn giản: tìm member từ state
        const member = members.find((m) => m.id === props.entity_identifier);
        const displayName = member?.name || props.entity_identifier;
        return (
          <span className="not-prose inline px-1 py-0.5 rounded bg-custom-primary-100/20 text-custom-primary-500">
            @{displayName}
          </span>
        );
      },
      getMentionedEntityDetails: (id: string) => {
        const member = members.find((m) => m.id === id);
        return { display_name: member?.name ?? id };
      },
    };
  }, [members]);

  const saveDescription = useCallback(
    async (value: string) => {
      if (!onSubmit || value === lastSavedValueRef.current) return;

      try {
        await onSubmit(value);
        lastSavedValueRef.current = value;
      } catch (error) {
        console.error(`Failed to autosave description for issue ${issueId}:`, error);
      }
    },
    [issueId, onSubmit]
  );

  const debouncedSave = useMemo(() => debounce(saveDescription, 1500), [saveDescription]);

  useEffect(
    () => () => {
      // Flush any pending autosave when unmounting so edits are not lost
      debouncedSave.flush();
    },
    [debouncedSave]
  );

  const handleDescriptionChange = useCallback(
    (_json: any, html: string) => {
      if (disabled || !onSubmit) return;
      if (html === lastSavedValueRef.current) return;

      debouncedSave(html);
    },
    [debouncedSave, disabled, onSubmit]
  );

  // Chờ members load xong (hoặc không có projectId) rồi mới render editor
  if (projectId && !membersLoaded) {
    return (
      <div className={containerClassName}>
        <div className="flex items-center justify-center p-4 text-sm text-custom-text-300">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <LiteTextEditorWithRef
        flaggedExtensions={[]}
        key={issueId}
        ref={editorRef}
        id={`issue-description-${issueId}`}
        editable={!disabled}
        initialValue={editorValue}
        disabledExtensions={disabledExtensions}
        fileHandler={fileHandler}
        mentionHandler={mentionHandler}
        onChange={handleDescriptionChange}
        placeholder="Thêm mô tả..."
        containerClassName="border-none !text-sm"
        editorClassName="!text-sm"
      />
    </div>
  );
};
