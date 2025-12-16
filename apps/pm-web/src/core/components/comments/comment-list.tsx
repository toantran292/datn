"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { IComment } from "@/core/types/comment";
import { CommentCard } from "./comment-card";
import { CommentCreate } from "./comment-create";
import { CommentService } from "@/core/services/comment/comment.service";
import { IdentityService } from "@/core/services/identity/identity.service";
import { ProjectService } from "@/core/services/project/project.service";

interface CommentListProps {
  issueId: string;
  projectId: string;
  disabled?: boolean;
  currentUserId?: string;
}

const commentService = new CommentService();
const identityService = new IdentityService();
const projectService = new ProjectService();

export const CommentList: React.FC<CommentListProps> = ({ issueId, projectId, disabled = false, currentUserId }) => {
  const [comments, setComments] = useState<IComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [authors, setAuthors] = useState<Record<string, { email?: string; displayName?: string }>>({});
  const [, setIsLoadingAuthors] = useState(false);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);

  const loadComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await commentService.getCommentsByIssue(issueId);
      setComments(data);
    } catch (err: any) {
      console.error("Failed to load comments:", err);
      setError(err?.message || "Không thể tải bình luận");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [issueId]);

  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const project = await projectService.getProjectById(projectId);
        setOrgId(project.orgId);
      } catch (err) {
        console.error("Failed to load project info for comments:", err);
      }
    };

    fetchOrgId();
  }, [projectId]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!orgId) return;

      setIsLoadingAuthors(true);
      try {
        let page = 0;
        const size = 200;
        let totalPages = 1;
        const collected: { id: string; name: string; email?: string }[] = [];

        while (page < totalPages) {
          const response = await identityService.getOrgMembers(orgId, page, size);
          totalPages = response.totalPages || 1;

          response.items?.forEach((member) => {
            collected.push({
              id: member.id,
              name: member.display_name || member.email || "User",
              email: member.email,
            });
          });

          page += 1;
        }

        const uniqueMembersMap: Record<string, { id: string; name: string; email?: string }> = {};
        collected.forEach((m) => {
          uniqueMembersMap[m.id] = m;
        });

        setMembers(Object.values(uniqueMembersMap));

        // update authors for any known IDs in comments
        const commentUserIds = new Set(comments.map((c) => c.createdBy).filter(Boolean));
        const foundAuthors: Record<string, { email?: string; displayName?: string }> = {};
        Object.values(uniqueMembersMap).forEach((m) => {
          if (commentUserIds.has(m.id)) {
            foundAuthors[m.id] = {
              email: m.email,
              displayName: m.name,
            };
          }
        });
        if (Object.keys(foundAuthors).length > 0) {
          setAuthors((prev) => ({ ...prev, ...foundAuthors }));
        }
      } catch (err) {
        console.error("Failed to load members/authors:", err);
      } finally {
        setIsLoadingAuthors(false);
        setMembersLoaded(true);
      }
    };

    fetchMembers();
  }, [orgId, comments]);

  const handleCreateComment = async (commentHtml: string) => {
    try {
      const newComment = await commentService.createComment(issueId, {
        projectId,
        commentHtml,
      });
      setComments((prev) => [...prev, newComment]);
    } catch (err: any) {
      console.error("Failed to create comment:", err);
      throw err;
    }
  };

  const handleUpdateComment = async (commentId: string, commentHtml: string) => {
    try {
      const updated = await commentService.updateComment(commentId, { commentHtml });
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    } catch (err: any) {
      console.error("Failed to update comment:", err);
      throw err;
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      console.error("Failed to delete comment:", err);
      throw err;
    }
  };

  if (isLoading || !membersLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-custom-text-400">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create comment */}
      {!disabled && <CommentCreate onSubmit={handleCreateComment} disabled={disabled} members={members} />}

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="rounded-md border border-custom-border-200 bg-custom-background-100">
          <div className="divide-y divide-custom-border-200">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
                disabled={disabled}
                currentUserId={currentUserId}
                authorEmail={authors[comment.createdBy]?.email}
                authorName={authors[comment.createdBy]?.displayName}
                members={members}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border border-custom-border-200 bg-custom-background-100 p-8">
          <MessageSquare className="mb-2 h-8 w-8 text-custom-text-400" />
          <p className="text-sm text-custom-text-400">Chưa có bình luận nào</p>
          {!disabled && (
            <p className="mt-1 text-xs text-custom-text-400">Hãy là người đầu tiên bình luận về công việc này</p>
          )}
        </div>
      )}
    </div>
  );
};
