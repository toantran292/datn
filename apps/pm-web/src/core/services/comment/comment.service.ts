import { APIService } from "../api.service";
import type { IComment, ICreateCommentPayload, IUpdateCommentPayload } from "../../types/comment";

export class CommentService extends APIService {
  constructor() {
    super();
  }

  async getCommentsByIssue(issueId: string): Promise<IComment[]> {
    return this.get(`/api/issues/${issueId}/comments`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  async getCommentById(commentId: string): Promise<IComment> {
    return this.get(`/api/comments/${commentId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  async createComment(issueId: string, data: ICreateCommentPayload): Promise<IComment> {
    return this.post(`/api/issues/${issueId}/comments`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  async updateComment(commentId: string, data: IUpdateCommentPayload): Promise<IComment> {
    return this.put(`/api/comments/${commentId}`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  async deleteComment(commentId: string): Promise<void> {
    return this.delete(`/api/comments/${commentId}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }
}
