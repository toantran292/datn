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
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import type { EditorRefApi } from "@uts/design-system/editor";

interface CommentToolbarProps {
  editorRef: React.RefObject<EditorRefApi | null>;
  disabled?: boolean;
}

export const CommentToolbar: React.FC<CommentToolbarProps> = ({ editorRef, disabled = false }) => {
  const executeCommand = (itemKey: string, extraProps?: any) => {
    if (disabled) return;
    editorRef.current?.executeMenuItemCommand({ itemKey, ...extraProps } as any);
  };

  const ToolbarButton = ({
    icon: Icon,
    onClick,
    title
  }: {
    icon: React.ElementType;
    onClick: () => void;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded text-custom-text-300 hover:bg-custom-background-80 hover:text-custom-text-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  );

  const ToolbarDivider = () => (
    <div className="h-5 w-px bg-custom-border-200" />
  );

  return (
    <div className="flex items-center gap-0.5 border-b border-custom-border-200 px-2 py-1.5">
      {/* Basic formatting */}
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

      {/* Text alignment */}
      <ToolbarButton
        icon={AlignLeft}
        onClick={() => executeCommand("text-align", { alignment: "left" })}
        title="Align Left"
      />
      <ToolbarButton
        icon={AlignCenter}
        onClick={() => executeCommand("text-align", { alignment: "center" })}
        title="Align Center"
      />
      <ToolbarButton
        icon={AlignRight}
        onClick={() => executeCommand("text-align", { alignment: "right" })}
        title="Align Right"
      />

      <ToolbarDivider />

      {/* Lists */}
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

      {/* User actions */}
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
  );
};
