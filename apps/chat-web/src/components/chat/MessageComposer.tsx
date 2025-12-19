"use client";

import { useRef, memo, useCallback, useState, useMemo } from "react";
import type { Room } from "../../types";
import type { UserInfo } from "../../contexts/ChatContext";
import { FilePreviewList, type PendingFile } from "./FilePreview";
import { RichTextEditor, type RichTextEditorRef } from "./RichTextEditor";
import { MessageInputToolbar } from "./MessageInputToolbar";

export interface MessageComposerProps {
  room: Room | null;
  onSendMessage: (html: string, mentionedUserIds?: string[]) => void;
  placeholder?: string;
  pendingFiles?: PendingFile[];
  onFilesSelect?: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  members?: Map<string, UserInfo>;
  currentUserId?: string;
}

// Completely isolated file preview - never affects editor
const FilePreviewSection = memo(({
  files,
  onRemove
}: {
  files: PendingFile[];
  onRemove?: (fileId: string) => void;
}) => {
  if (!onRemove || files.length === 0) return null;
  return <FilePreviewList files={files} onRemove={onRemove} />;
});
FilePreviewSection.displayName = "FilePreviewSection";

// Isolated editor section - props are stabilized
const EditorSection = memo(({
  editorRef,
  placeholder,
  members,
  currentUserId,
  onSubmitRef,
  onContentChangeRef,
}: {
  editorRef: React.MutableRefObject<RichTextEditorRef | null>;
  placeholder: string;
  members?: Map<string, UserInfo>;
  currentUserId?: string;
  onSubmitRef: React.MutableRefObject<(() => void) | undefined>;
  onContentChangeRef: React.MutableRefObject<(() => void) | undefined>;
}) => {
  // Create stable callbacks that read from refs
  const handleSubmit = useCallback(() => {
    onSubmitRef.current?.();
  }, [onSubmitRef]);

  const handleContentChange = useCallback(() => {
    onContentChangeRef.current?.();
  }, [onContentChangeRef]);

  return (
    <div className="px-3 py-2">
      <RichTextEditor
        ref={editorRef}
        placeholder={placeholder}
        members={members}
        currentUserId={currentUserId}
        onSubmit={handleSubmit}
        onContentChange={handleContentChange}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props actually change
  return prevProps.placeholder === nextProps.placeholder &&
         prevProps.members === nextProps.members &&
         prevProps.currentUserId === nextProps.currentUserId;
});
EditorSection.displayName = "EditorSection";

export function MessageComposer({
  room,
  onSendMessage,
  placeholder,
  pendingFiles = [],
  onFilesSelect,
  onFileRemove,
  members,
  currentUserId,
}: MessageComposerProps) {
  const editorRef = useRef<RichTextEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasContent, setHasContent] = useState(false);

  // Store callbacks in refs to avoid re-renders
  const pendingFilesRef = useRef(pendingFiles);
  pendingFilesRef.current = pendingFiles;

  const onSendMessageRef = useRef(onSendMessage);
  onSendMessageRef.current = onSendMessage;

  // Ref for submit handler - accessed by EditorSection
  const handleSubmitRef = useRef<() => void>();
  handleSubmitRef.current = () => {
    const html = editorRef.current?.getHtml() || "";
    const text = editorRef.current?.getText() || "";
    const mentionedUserIds = editorRef.current?.getMentionedUserIds() || [];

    if (!text.trim() && pendingFilesRef.current.length === 0) return;

    onSendMessageRef.current(html, mentionedUserIds);
    editorRef.current?.clear();
    setHasContent(false);
  };

  // Ref for content change handler
  const handleContentChangeRef = useRef<() => void>();
  handleContentChangeRef.current = () => {
    const text = editorRef.current?.getText() || "";
    setHasContent(text.trim().length > 0);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onFilesSelect) {
      onFilesSelect(Array.from(files));
    }
    e.target.value = "";
  }, [onFilesSelect]);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const computedPlaceholder = useMemo(() => {
    if (placeholder) return placeholder;
    return "Tin nhắn";
  }, [placeholder]);

  const isUploading = pendingFiles.some((f) => f.status === "uploading");
  const canSend = hasContent || pendingFiles.length > 0;

  // Create stable toolbar submit handler
  const handleToolbarSubmit = useCallback(() => {
    handleSubmitRef.current?.();
  }, []);

  return (
    <div className="px-3 md:px-5 pb-3 md:pb-5 pt-2">
      {/* File preview - completely isolated */}
      <FilePreviewSection files={pendingFiles} onRemove={onFileRemove} />

      <div className="bg-custom-background-100 border border-custom-border-200 rounded-xl focus-within:border-custom-primary-100 focus-within:ring-1 focus-within:ring-custom-primary-100/20 transition-all overflow-hidden">
        {/* Editor - isolated with ref-based callbacks */}
        <EditorSection
          editorRef={editorRef}
          placeholder={computedPlaceholder}
          members={members}
          currentUserId={currentUserId}
          onSubmitRef={handleSubmitRef}
          onContentChangeRef={handleContentChangeRef}
        />

        {/* Toolbar */}
        <MessageInputToolbar
          editorRef={{ current: editorRef.current?.getEditorRef() || null }}
          disabled={isUploading}
          onAttachClick={onFilesSelect ? handleAttachClick : undefined}
          showAttachButton={!!onFilesSelect}
          onSend={handleToolbarSubmit}
          canSend={canSend && !isUploading}
        />

        {/* Hidden file input */}
        {onFilesSelect && (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
        )}
      </div>

      {/* Keyboard shortcut hint - hide on mobile */}
      <div className="hidden sm:flex justify-center mt-1.5">
        <span className="text-xs text-custom-text-400">
          <kbd className="px-1 py-0.5 bg-custom-background-80 rounded text-[10px]">
            Enter
          </kbd>{" "}
          để gửi{" "}
          <span className="mx-1 text-custom-text-300">•</span>{" "}
          <kbd className="px-1 py-0.5 bg-custom-background-80 rounded text-[10px]">
            Shift+Enter
          </kbd>{" "}
          để xuống dòng
        </span>
      </div>
    </div>
  );
}
