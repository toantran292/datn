"use client";

import { useRef, useMemo, useCallback, useEffect } from "react";
import debounce from "lodash/debounce";
import {
  LiteTextEditorWithRef,
  type EditorRefApi,
  type TExtensions,
  type TFileHandler,
  type TMentionHandler,
} from "@uts/design-system/editor";

interface IssueDescriptionProps {
  issueId: string;
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
  initialValue = "",
  disabled = false,
  onSubmit,
  containerClassName = "",
}) => {
  const editorRef = useRef<EditorRefApi | null>(null);

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

  const mentionHandler = useMemo<TMentionHandler>(
    () => ({
      renderComponent: () => null,
      searchCallback: async () => [],
      getMentionedEntityDetails: () => ({ display_name: "" }),
    }),
    []
  );

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

  const handleDescriptionChange = useCallback((_json: any, html: string) => {
    if (disabled || !onSubmit) return;
    if (html === lastSavedValueRef.current) return;

    debouncedSave(html);
  }, [debouncedSave, disabled, onSubmit]);

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
        editorClassName="min-h-[150px] !text-sm"
      />
    </div>
  );
};
