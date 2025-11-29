"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@uts/fe-utils";

interface IssueTitleInputProps {
  disabled?: boolean;
  value: string;
  onChange?: (value: string) => Promise<void>;
  className?: string;
  containerClassName?: string;
}

export const IssueTitleInput: React.FC<IssueTitleInputProps> = ({
  disabled,
  value,
  onChange,
  className,
  containerClassName,
}) => {
  const [title, setTitle] = useState(value);
  const [isLengthVisible, setIsLengthVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (value !== title) {
      setTitle(value);
    }
  }, [value]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [title]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleBlur = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle !== value && onChange) {
      if (trimmedTitle.length > 0) {
        await onChange(trimmedTitle);
      } else {
        setTitle(value); // Reset to original if empty
      }
    }
  }, [title, value, onChange]);

  if (disabled) {
    return <div className="whitespace-pre-line text-2xl font-medium">{title}</div>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("relative", containerClassName)}>
        <textarea
          ref={textareaRef}
          className={cn(
            "block w-full resize-none overflow-hidden rounded border-none bg-transparent px-3 py-0 text-lg font-bold outline-none ring-0 focus:ring-0",
            {
              "ring-1 ring-red-400 mx-2.5": title?.length === 0,
            },
            className
          )}
          disabled={disabled}
          value={title}
          onChange={handleTitleChange}
          onBlur={handleBlur}
          maxLength={255}
          placeholder="Tiêu đề công việc"
          onFocus={() => setIsLengthVisible(true)}
          rows={1}
        />
        <div
          className={cn(
            "pointer-events-none absolute bottom-1 right-1 z-[2] rounded bg-custom-background-100 p-0.5 text-xs text-custom-text-200 opacity-0 transition-opacity",
            {
              "opacity-100": isLengthVisible,
            }
          )}
        >
          <span className={`${title.length === 0 || title.length > 255 ? "text-red-500" : ""}`}>{title.length}</span>
          /255
        </div>
      </div>
      {title?.length === 0 && <span className="text-sm font-medium text-red-500">Tiêu đề là bắt buộc</span>}
    </div>
  );
};
