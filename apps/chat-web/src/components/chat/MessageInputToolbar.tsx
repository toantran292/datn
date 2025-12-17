"use client";

import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  Quote,
  Smile,
  Paperclip,
  Send,
} from "lucide-react";
import type { EditorRefApi } from "@uts/design-system/editor";
import { useState } from "react";

// Quick emoji picker - common chat emojis
const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '😮', '😢', '🙏'];

interface MessageInputToolbarProps {
  editorRef: React.RefObject<EditorRefApi | null>;
  disabled?: boolean;
  onAttachClick?: () => void;
  showAttachButton?: boolean;
  onSend?: () => void;
  canSend?: boolean;
}

export const MessageInputToolbar: React.FC<MessageInputToolbarProps> = ({
  editorRef,
  disabled = false,
  onAttachClick,
  showAttachButton = true,
  onSend,
  canSend = false,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const executeCommand = (itemKey: string, extraProps?: Record<string, unknown>) => {
    if (disabled) return;
    editorRef.current?.executeMenuItemCommand({ itemKey, ...extraProps } as Parameters<EditorRefApi['executeMenuItemCommand']>[0]);
    editorRef.current?.focus("end");
  };

  const insertEmoji = (emoji: string) => {
    if (disabled) return;
    // Use setEditorValueAtCursorPosition to insert emoji at cursor position
    editorRef.current?.setEditorValueAtCursorPosition(emoji);
    editorRef.current?.focus("end");
    setShowEmojiPicker(false);
  };

  const ToolbarButton = ({
    icon: Icon,
    onClick,
    title,
    active,
  }: {
    icon: React.ElementType;
    onClick: () => void;
    title: string;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex h-7 w-7 items-center justify-center rounded transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${active
          ? 'bg-custom-background-80 text-custom-text-100'
          : 'text-custom-text-300 hover:bg-custom-background-80 hover:text-custom-text-100'
        }
      `}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  );

  const ToolbarDivider = () => (
    <div className="h-5 w-px bg-custom-border-200 mx-0.5" />
  );

  return (
    <div className="flex items-center justify-between border-t border-custom-border-100 px-2 py-1.5">
      {/* Left: Formatting buttons */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={Bold}
          onClick={() => executeCommand("bold")}
          title="Bold (Cmd+B)"
        />
        <ToolbarButton
          icon={Italic}
          onClick={() => executeCommand("italic")}
          title="Italic (Cmd+I)"
        />
        <ToolbarButton
          icon={Underline}
          onClick={() => executeCommand("underline")}
          title="Underline (Cmd+U)"
        />
        <ToolbarButton
          icon={Strikethrough}
          onClick={() => executeCommand("strikethrough")}
          title="Strikethrough"
        />

        <ToolbarDivider />

        <ToolbarButton
          icon={List}
          onClick={() => executeCommand("bulleted-list")}
          title="Bullet List"
        />
        <ToolbarButton
          icon={ListOrdered}
          onClick={() => executeCommand("numbered-list")}
          title="Numbered List"
        />

        <ToolbarDivider />

        <ToolbarButton
          icon={Quote}
          onClick={() => executeCommand("quote")}
          title="Quote"
        />
        <ToolbarButton
          icon={Code}
          onClick={() => executeCommand("code")}
          title="Code"
        />
      </div>

      {/* Right: Emoji, Attachment, Send */}
      <div className="flex items-center gap-0.5">
        {/* Emoji Picker */}
        <div className="relative">
          <ToolbarButton
            icon={Smile}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add emoji"
            active={showEmojiPicker}
          />

          {showEmojiPicker && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="absolute bottom-full right-0 mb-1 bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-lg p-2 z-50">
                <div className="flex gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-custom-background-80 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Attachment */}
        {showAttachButton && onAttachClick && (
          <ToolbarButton
            icon={Paperclip}
            onClick={onAttachClick}
            title="Attach file"
          />
        )}

        {/* Send Button */}
        {onSend && (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend || disabled}
            className={`
              flex h-7 w-7 items-center justify-center rounded-md ml-1 transition-all
              ${canSend && !disabled
                ? 'bg-custom-primary-100 text-white hover:bg-custom-primary-200'
                : 'bg-custom-background-80 text-custom-text-400 cursor-not-allowed'
              }
            `}
            title="Send message (Enter)"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
};
