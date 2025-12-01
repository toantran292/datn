export class CommentResponseDto {
  id: string;
  issueId: string;
  projectId: string;
  comment: string | null;
  commentHtml: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
