export interface IComment {
  id: string;
  issueId: string;
  projectId: string;
  comment: string | null;
  commentHtml: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCommentPayload {
  projectId: string;
  comment?: string;
  commentHtml?: string;
}

export interface IUpdateCommentPayload {
  comment?: string;
  commentHtml?: string;
}
