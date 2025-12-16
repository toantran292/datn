"use client";

import { useRef, useMemo, useCallback } from "react";
import type { Room } from "../../types";
import type { UserInfo } from "../../contexts/ChatContext";
import { FilePreviewList, type PendingFile } from "./FilePreview";
import { MessageInputToolbar } from "./MessageInputToolbar";
import {
  LiteTextEditorWithRef,
  type EditorRefApi,
  type TExtensions,
  type TFileHandler,
  type TMentionHandler,
} from "@uts/design-system/editor";

// Avatar component for mention suggestions (without online indicator - it's shown separately)
function MemberAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const getAvatarColor = (str: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
      'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'
    ];
    const index = str.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className="w-6 h-6 rounded-md object-cover"
    />
  ) : (
    <div className={`w-6 h-6 ${getAvatarColor(name)} rounded-md flex items-center justify-center text-white text-xs font-semibold`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export interface MessageInputProps {
  room: Room | null;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  pendingFiles?: PendingFile[];
  onFilesSelect?: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  members?: Map<string, UserInfo>;
  currentUserId?: string;
}

export function MessageInput({
  room,
  value,
  onChange,
  onSubmit,
  placeholder,
  pendingFiles = [],
  onFilesSelect,
  onFileRemove,
  members,
  currentUserId,
}: MessageInputProps) {
  const editorRef = useRef<EditorRefApi | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const disabledExtensions: TExtensions[] = useMemo(
    () => [
      "ai",
      "collaboration-cursor",
      "issue-embed",
      "slash-commands",
      "image",
    ],
    []
  );

  const fileHandler: TFileHandler = useMemo(
    () => ({
      assetsUploadStatus: {},
      cancel: () => undefined,
      checkIfAssetExists: async () => false,
      delete: async () => Promise.resolve(),
      getAssetDownloadSrc: async (path: string) => path,
      getAssetSrc: async (path: string) => path,
      restore: async () => Promise.resolve(),
      upload: async () => Promise.reject(new Error("Upload not supported")),
      validation: { maxFileSize: 10 * 1024 * 1024 },
    }),
    []
  );

  // Empty array - memoized to prevent re-renders
  const flaggedExtensions = useMemo(() => [], []);

  // Memoize class names to prevent re-renders
  const containerClassName = "border-none !text-[15px]";
  const editorClassName = "min-h-[44px] max-h-[200px] overflow-y-auto !text-[15px] leading-relaxed";

  // Use ref to always access latest members in callbacks
  const membersRef = useRef<Map<string, UserInfo>>(new Map());
  membersRef.current = members || new Map();

  // Helper to get members array from ref
  const getMembersArray = () => Array.from(membersRef.current.values());

  // Store currentUserId in ref to avoid stale closure
  const currentUserIdRef = useRef<string | undefined>(currentUserId);
  currentUserIdRef.current = currentUserId;

  const mentionHandler: TMentionHandler = useMemo(
    () => ({
      searchCallback: async (query: string) => {
        const membersArray = getMembersArray();
        const q = query?.toLowerCase?.() ?? "";
        const filtered = !q
          ? membersArray
          : membersArray.filter((m) =>
              m.displayName?.toLowerCase().includes(q)
            );

        return [
          {
            key: "members",
            title: "Members",
            items: filtered.slice(0, 10).map((member) => {
              const isCurrentUser = member.userId === currentUserIdRef.current;
              return {
                id: member.userId,
                title: member.displayName || `User ${member.userId.slice(0, 8)}`,
                subTitle: isCurrentUser ? "(you)" : undefined,
                entity_identifier: member.userId,
                entity_name: "user_mention" as const,
                isOnline: member.isOnline,
                icon: (
                  <MemberAvatar
                    name={member.displayName || member.userId}
                    avatarUrl={member.avatarUrl}
                  />
                ),
              };
            }),
          },
        ];
      },
      renderComponent: (props) => {
        const membersArray = getMembersArray();
        const member = membersArray.find((m) => m.userId === props.entity_identifier);
        const displayName = member?.displayName || props.entity_identifier.slice(0, 8);
        return (
          <span className="inline px-1 py-0.5 rounded bg-custom-primary-100/20 text-custom-primary-100 font-medium">
            @{displayName}
          </span>
        );
      },
      getMentionedEntityDetails: (id: string) => {
        const membersArray = getMembersArray();
        const member = membersArray.find((m) => m.userId === id);
        return { display_name: member?.displayName ?? id.slice(0, 8) };
      },
    }),
    [] // No dependencies - uses refs for latest data
  );

  // Store onChange in ref to use stable callback
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleEditorChange = useCallback((_json: unknown, html: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    onChangeRef.current(text);
  }, []);

  // Store pendingFiles length in ref for stable callback
  const pendingFilesRef = useRef(pendingFiles);
  pendingFilesRef.current = pendingFiles;

  // Store onSubmit in ref
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const handleSubmit = useCallback(() => {
    const editorDocument = editorRef.current?.getDocument();
    const html = editorDocument?.html || "";

    // Check if empty
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || "";

    if (!text.trim() && pendingFilesRef.current.length === 0) return;

    onSubmitRef.current();
    editorRef.current?.clearEditor();
  }, []);

  const handleEnterKeyPress = useCallback((e?: KeyboardEvent) => {
    // Only submit on Enter without Shift
    if (!e?.shiftKey) {
      e?.preventDefault?.();
      // Call handleSubmit logic directly since we can't use the memoized version
      const editorDocument = editorRef.current?.getDocument();
      const html = editorDocument?.html || "";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const text = tempDiv.textContent || tempDiv.innerText || "";
      if (!text.trim() && pendingFilesRef.current.length === 0) return;
      onSubmitRef.current();
      editorRef.current?.clearEditor();
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onFilesSelect) {
      onFilesSelect(Array.from(files));
    }
    e.target.value = "";
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const computedPlaceholder = useMemo(() => {
    if (placeholder) return placeholder;
    if (!room) return "Write a message...";
    return `Message ${room.type === "channel" ? "#" + (room.name || "channel") : room.name || "conversation"}`;
  }, [placeholder, room]);

  const hasContent = !!(value.trim() || pendingFiles.length > 0);
  const isUploading = pendingFiles.some((f) => f.status === "uploading");

  return (
    <div className="px-5 pb-5 pt-2">
      {/* Pending files preview */}
      {pendingFiles.length > 0 && onFileRemove && (
        <FilePreviewList files={pendingFiles} onRemove={onFileRemove} />
      )}

      <div className="bg-custom-background-100 border border-custom-border-200 rounded-xl focus-within:border-custom-primary-100 focus-within:ring-1 focus-within:ring-custom-primary-100/20 transition-all overflow-hidden">
        {/* Rich Text Editor */}
        <div className="px-3 py-2">
          <LiteTextEditorWithRef
            ref={editorRef}
            id="message-input"
            editable={!isUploading}
            initialValue="<p></p>"
            disabledExtensions={disabledExtensions}
            flaggedExtensions={flaggedExtensions}
            fileHandler={fileHandler}
            mentionHandler={mentionHandler}
            onChange={handleEditorChange}
            onEnterKeyPress={handleEnterKeyPress}
            placeholder={computedPlaceholder}
            containerClassName={containerClassName}
            editorClassName={editorClassName}
          />
        </div>

        {/* Toolbar with formatting, emoji, attachment, and send */}
        <MessageInputToolbar
          editorRef={editorRef}
          disabled={isUploading}
          onAttachClick={onFilesSelect ? handleAttachClick : undefined}
          showAttachButton={!!onFilesSelect}
          onSend={handleSubmit}
          canSend={hasContent && !isUploading}
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

      {/* Keyboard shortcut hint */}
      <div className="flex justify-center mt-1.5">
        <span className="text-xs text-custom-text-400">
          <kbd className="px-1 py-0.5 bg-custom-background-80 rounded text-[10px]">
            Enter
          </kbd>{" "}
          to send{" "}
          <span className="mx-1 text-custom-text-300">•</span>{" "}
          <kbd className="px-1 py-0.5 bg-custom-background-80 rounded text-[10px]">
            Shift+Enter
          </kbd>{" "}
          for new line
        </span>
      </div>
    </div>
  );
}
