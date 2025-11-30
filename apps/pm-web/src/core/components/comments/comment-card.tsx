"use client";

import { useState, useRef } from "react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Avatar, Button } from "@uts/design-system/ui";
import {
  LiteTextEditorWithRef,
  type EditorRefApi,
  type TExtensions,
  type TFileHandler,
  type TMentionHandler,
} from "@uts/design-system/editor";
import type { IComment } from "@/core/types/comment";
import { CommentToolbar } from "./comment-toolbar";

interface CommentCardProps {
  comment: IComment;
  onUpdate?: (commentId: string, commentHtml: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  disabled?: boolean;
  currentUserId?: string;
  authorEmail?: string;
  authorName?: string;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  onUpdate,
  onDelete,
  disabled = false,
  currentUserId,
  authorEmail,
  authorName,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedHtml, setEditedHtml] = useState(comment.commentHtml || "");
  const editorRef = useRef<EditorRefApi | null>(null);

  const isOwner = currentUserId === comment.createdBy;
  const canEdit = isOwner && !disabled && onUpdate;
  const canDelete = isOwner && !disabled && onDelete;

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

  const handleEdit = () => {
    setEditedHtml(comment.commentHtml || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedHtml(comment.commentHtml || "");
  };

  const handleSaveEdit = async () => {
    if (!onUpdate) return;

    const editorDocument = editorRef.current?.getDocument();
    const html = editorDocument?.html || editedHtml || "";
    const cleanedHtml = html.trim();

    setIsSubmitting(true);
    try {
      await onUpdate(comment.id, cleanedHtml);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;

    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  };

  const authorLabel = authorName || authorEmail || "User";
  const avatarText = (authorName || authorEmail || comment.createdBy || "U").charAt(0).toUpperCase();

  return (
    <div className="group flex gap-3 border-b border-custom-border-200 p-4 last:border-0">
      {/* Avatar */}
      <Avatar name={authorName || authorEmail || comment.createdBy || "U"} size={25} className="flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-custom-text-100">{authorLabel}</span>
            <span className="text-xs text-custom-text-400">{formatDate(comment.createdAt)}</span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-custom-text-400">(đã chỉnh sửa)</span>
            )}
          </div>

          {/* Actions */}

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleEdit}
              className="rounded p-1 text-custom-text-300 hover:bg-custom-background-80 hover:text-custom-text-100"
              title="Chỉnh sửa"
            >
              <Edit2 className="h-4 w-4" />
            </button>

            <button
              onClick={handleDelete}
              className="rounded p-1 text-custom-text-300 hover:bg-custom-background-80 hover:text-red-500"
              title="Xóa"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <div className="rounded-md border border-custom-border-200 bg-custom-background-100">
              <CommentToolbar editorRef={editorRef} disabled={isSubmitting} />
              <div className="px-2 pb-2">
                <LiteTextEditorWithRef
                  ref={editorRef}
                  id={`comment-edit-${comment.id}`}
                  editable={!isSubmitting}
                  initialValue={comment.commentHtml || "<p></p>"}
                  disabledExtensions={disabledExtensions}
                  flaggedExtensions={[]}
                  fileHandler={fileHandler}
                  mentionHandler={mentionHandler}
                  onChange={(_json, html) => setEditedHtml(html)}
                  placeholder="Chỉnh sửa bình luận..."
                  containerClassName="border-none !text-sm"
                  editorClassName="min-h-[80px] !text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary" onClick={handleSaveEdit} disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu"}
              </Button>
              <Button size="sm" variant="neutral-primary" onClick={handleCancelEdit} disabled={isSubmitting}>
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm mt-2 max-w-none text-custom-text-200">
            {comment.commentHtml ? (
              <div dangerouslySetInnerHTML={{ __html: comment.commentHtml }} />
            ) : (
              <p>{comment.comment || "Không có nội dung"}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
