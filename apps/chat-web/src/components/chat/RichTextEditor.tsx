"use client";

import { useRef, useMemo, useCallback, useImperativeHandle, forwardRef, memo } from "react";
import type { UserInfo } from "../../contexts/ChatContext";
import {
  LiteTextEditorWithRef,
  type EditorRefApi,
  type TExtensions,
  type TFileHandler,
  type TMentionHandler,
} from "@uts/design-system/editor";

// Avatar component for mention suggestions
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

export interface RichTextEditorRef {
  getHtml: () => string;
  getText: () => string;
  getMentionedUserIds: () => string[];
  clear: () => void;
  focus: () => void;
  getEditorRef: () => EditorRefApi | null;
}

export interface RichTextEditorProps {
  placeholder?: string;
  disabled?: boolean;
  members?: Map<string, UserInfo>;
  currentUserId?: string;
  onSubmit?: () => void;
  onContentChange?: () => void;
}

const RichTextEditorInnerComponent = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  placeholder = "Viết tin nhắn...",
  disabled = false,
  members,
  currentUserId,
  onSubmit,
  onContentChange,
}, ref) => {
  const editorRef = useRef<EditorRefApi | null>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getHtml: () => {
      const doc = editorRef.current?.getDocument();
      return doc?.html || "";
    },
    getText: () => {
      const doc = editorRef.current?.getDocument();
      const html = doc?.html || "";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || "";
    },
    getMentionedUserIds: () => {
      const html = editorRef.current?.getDocument()?.html || "";
      // Parse HTML to extract user IDs from mention elements
      // The editor outputs: <mention-component entity_identifier="..." entity_name="user_mention">
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const mentions = doc.querySelectorAll('mention-component[entity_name="user_mention"]');
      const userIds: string[] = [];
      mentions.forEach((el) => {
        const id = el.getAttribute("entity_identifier");
        if (id && !userIds.includes(id)) {
          userIds.push(id);
        }
      });
      return userIds;
    },
    clear: () => {
      editorRef.current?.clearEditor();
    },
    focus: () => {
      editorRef.current?.focus("end");
    },
    getEditorRef: () => editorRef.current,
  }), []);

  const disabledExtensions: TExtensions[] = useMemo(
    () => ["ai", "collaboration-cursor", "issue-embed", "slash-commands", "image"],
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

  const flaggedExtensions = useMemo(() => [], []);

  // Use refs for dynamic data
  const membersRef = useRef<Map<string, UserInfo>>(new Map());
  membersRef.current = members || new Map();

  const currentUserIdRef = useRef<string | undefined>(currentUserId);
  currentUserIdRef.current = currentUserId;

  const getMembersArray = () => Array.from(membersRef.current.values());

  const mentionHandler: TMentionHandler = useMemo(
    () => ({
      searchCallback: async (query: string) => {
        const membersArray = getMembersArray();
        const q = query?.toLowerCase?.() ?? "";
        const filtered = !q
          ? membersArray
          : membersArray.filter((m) => m.displayName?.toLowerCase().includes(q));

        return [
          {
            key: "members",
            items: filtered.slice(0, 10).map((member) => {
              const isCurrentUser = member.userId === currentUserIdRef.current;
              return {
                id: member.userId,
                title: member.displayName || `User ${member.userId.slice(0, 8)}`,
                subTitle: isCurrentUser ? "(bạn)" : undefined,
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
    []
  );

  // Store callbacks in refs
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;

  const handleEnterKeyPress = useCallback((e?: KeyboardEvent) => {
    if (!e?.shiftKey) {
      e?.preventDefault?.();
      onSubmitRef.current?.();
    }
  }, []);

  const handleChange = useCallback(() => {
    onContentChangeRef.current?.();
  }, []);

  return (
    <LiteTextEditorWithRef
      ref={editorRef}
      id="message-input"
      editable={!disabled}
      initialValue="<p></p>"
      disabledExtensions={disabledExtensions}
      flaggedExtensions={flaggedExtensions}
      fileHandler={fileHandler}
      mentionHandler={mentionHandler}
      onChange={handleChange}
      onEnterKeyPress={handleEnterKeyPress}
      placeholder={placeholder}
      containerClassName="border-none !text-[15px]"
      editorClassName="min-h-[44px] max-h-[200px] overflow-y-auto !text-[15px] leading-relaxed"
    />
  );
});

RichTextEditorInnerComponent.displayName = "RichTextEditorInner";

// Custom memo comparison - re-render when visual props or members change
// onSubmit, onContentChange use refs internally so they don't trigger re-renders
export const RichTextEditor = memo(RichTextEditorInnerComponent, (prevProps, nextProps) => {
  return prevProps.placeholder === nextProps.placeholder &&
         prevProps.disabled === nextProps.disabled &&
         prevProps.members === nextProps.members &&
         prevProps.currentUserId === nextProps.currentUserId;
});
