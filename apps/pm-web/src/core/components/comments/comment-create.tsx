"use client";

import { useRef, useState } from "react";
import { Button } from "@uts/design-system/ui";
import {
  LiteTextEditorWithRef,
  type EditorRefApi,
  type TExtensions,
  type TFileHandler,
  type TMentionHandler,
} from "@uts/design-system/editor";
import { CommentToolbar } from "./comment-toolbar";

interface CommentCreateProps {
  onSubmit: (commentHtml: string) => Promise<void>;
  disabled?: boolean;
}

export const CommentCreate: React.FC<CommentCreateProps> = ({ onSubmit, disabled = false }) => {
  const editorRef = useRef<EditorRefApi | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentHtml, setCommentHtml] = useState("<p></p>");

  const disabledExtensions: TExtensions[] = ["ai", "collaboration-cursor", "issue-embed", "slash-commands", "image"];

  const fileHandler: TFileHandler = {
    assetsUploadStatus: {},
    cancel: () => undefined,
    checkIfAssetExists: async () => false,
    delete: async () => Promise.resolve(),
    getAssetDownloadSrc: async (path: string) => path,
    getAssetSrc: async (path: string) => path,
    restore: async () => Promise.resolve(),
    upload: async () => Promise.reject(new Error("Upload not supported")),
    validation: { maxFileSize: 10 * 1024 * 1024 },
  };

  const mentionHandler: TMentionHandler = {
    renderComponent: () => null,
    searchCallback: async () => [],
    getMentionedEntityDetails: () => ({ display_name: "" }),
  };

  const handleSubmit = async () => {
    const editorDocument = editorRef.current?.getDocument();
    const html = editorDocument?.html || commentHtml || "";
    const cleanedHtml = html.trim();

    // Check if empty
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = cleanedHtml;
    const text = tempDiv.textContent || tempDiv.innerText || "";

    if (!text.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(cleanedHtml);
      // Clear editor after successful submit
      editorRef.current?.clearEditor();
      setCommentHtml("<p></p>");
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-md border border-custom-border-200 bg-custom-background-100" onKeyDown={handleKeyDown}>
      <CommentToolbar editorRef={editorRef} disabled={disabled || isSubmitting} />
      <div className="px-3 pb-3 pt-2">
        <LiteTextEditorWithRef
          ref={editorRef}
          id="comment-create"
          editable={!disabled && !isSubmitting}
          initialValue="<p></p>"
          disabledExtensions={disabledExtensions}
          flaggedExtensions={[]}
          fileHandler={fileHandler}
          mentionHandler={mentionHandler}
          onChange={(_json, html) => setCommentHtml(html)}
          placeholder="Thêm bình luận..."
          containerClassName="border-none !text-sm"
          editorClassName="min-h-[80px] !text-sm"
        />
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-custom-border-200 px-3 py-2">
        <Button size="sm" variant="primary" onClick={handleSubmit} disabled={disabled || isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
        </Button>
      </div>
    </div>
  );
};
