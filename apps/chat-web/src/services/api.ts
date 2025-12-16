import type { Room, Message, Reaction, Attachment, UnreadCount } from '../types';
import { validateRoomResponse } from '../utils/type-guards';

class ApiService {
  private baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/chat';
  private userId: string = '';
  private orgId: string = '';

  setAuth(userId: string, orgId: string) {
    this.userId = userId;
    this.orgId = orgId;
  }

  async createRoom(name: string, isPrivate: boolean): Promise<Room> {
    // Use relative path to leverage Vite proxy
    const response = await fetch(`${this.baseURL}/rooms`, {
      method: 'POST',
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, is_private: isPrivate }),
    });
    if (!response.ok) throw new Error('Failed to create room');
    return response.json();
  }

  async createChannel(name: string, isPrivate: boolean = false, projectId?: string | null): Promise<Room> {
    const payload = {
      name,
      is_private: isPrivate,
      project_id: projectId || null
    };

    console.log('[API] Creating channel with payload:', payload);

    const response = await fetch(`${this.baseURL}/rooms/channel`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[API] Failed to create channel:', error);
      throw new Error('Failed to create channel');
    }

    const room = await response.json();
    console.log('[API] Channel created, response:', room);

    // Validate backend response
    return validateRoomResponse(room, 'createChannel');
  }

  async createDM(userIds: string[]): Promise<Room> {
    const response = await fetch(`${this.baseURL}/rooms/dm`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_ids: userIds }),
    });
    if (!response.ok) throw new Error('Failed to create DM');
    return response.json();
  }

  /**
   * Find existing DM with the given set of users
   * Returns the DM room if exists, null otherwise
   */
  async findExistingDM(userIds: string[]): Promise<Room | null> {
    const params = new URLSearchParams();
    params.append('user_ids', userIds.join(','));

    const response = await fetch(`${this.baseURL}/rooms/dm/find?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (response.status === 404) {
      return null;
    }
    if (!response.ok) throw new Error('Failed to find DM');
    return response.json();
  }

  async listOrgUsers(): Promise<Array<{
    userId: string;
    email: string;
    displayName: string;
    disabled: boolean;
    avatarUrl?: string | null;
    isOnline?: boolean;
  }>> {
    // orgId is taken from context (X-Org-ID header set by Edge from JWT)
    const response = await fetch(`${this.baseURL}/internal/users`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to list org users');
    return response.json();
  }

  /**
   * List org-level channels (channels that belong to org, not any specific project)
   */
  async listOrgChannels(limit?: number): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${this.baseURL}/rooms/org-channels?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to list org channels');
    return response.json();
  }

  /**
   * List project-specific channels
   */
  async listProjectChannels(projectId: string, limit?: number): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    params.append('projectId', projectId);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${this.baseURL}/rooms/project-channels?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to list project channels');
    return response.json();
  }

  /**
   * List DMs for user in org (optimized query)
   */
  async listDms(limit?: number): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${this.baseURL}/rooms/dms?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to list DMs');
    return response.json();
  }

  /**
   * DEPRECATED: Use listOrgChannels, listProjectChannels, and listDms instead
   * List all joined rooms for user in org
   * - If projectId provided: returns rooms in that project only
   * - Otherwise: returns org-level channels only (no DMs)
   */
  async listJoinedRooms(limit?: number, projectId?: string | null): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (projectId !== undefined && projectId !== null) {
      // Only append if projectId is a non-null string
      params.append('projectId', projectId);
    }

    const response = await fetch(`${this.baseURL}/rooms?${params}`, {
      method: 'GET',
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to list joined rooms');
    return response.json();
  }

  /**
   * Browse PUBLIC org-level channels
   */
  async browseOrgPublicRooms(limit?: number): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${this.baseURL}/rooms/browse/org?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to browse org public rooms');
    return response.json();
  }

  /**
   * Browse PUBLIC project-specific channels
   */
  async browseProjectPublicRooms(projectId: string, limit?: number): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    params.append('projectId', projectId);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${this.baseURL}/rooms/browse/project?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to browse project public rooms');
    return response.json();
  }

  /**
   * DEPRECATED: Use browseOrgPublicRooms or browseProjectPublicRooms instead
   */
  async browsePublicRooms(limit?: number, projectId?: string | null): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (projectId !== undefined) {
      params.append('project_id', projectId || '');
    }

    const response = await fetch(`${this.baseURL}/rooms/browse?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to browse public rooms');
    return response.json();
  }

  async joinRoom(roomId: string): Promise<{ joined: boolean }> {
    const response = await fetch(`${this.baseURL}/rooms/join`, {
      method: 'POST',
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roomId }),
    });
    if (!response.ok) throw new Error('Failed to join room');
    return response.json();
  }

  async listRoomMembers(roomId: string): Promise<Array<{
    userId: string;
    orgId: string;
    lastSeenMessageId: string | null;
    email: string | null;
    displayName: string;
    avatarUrl: string | null;
    disabled: boolean;
    isOnline: boolean;
  }>> {
    const response = await fetch(`${this.baseURL}/rooms/${encodeURIComponent(roomId)}/members`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to list room members:', error);
      throw new Error('Failed to list room members');
    }
    return response.json();
  }

  async listMessages(roomId: string, pageSize?: number): Promise<{ items: Message[]; pageState: string | null }> {
    const params = new URLSearchParams({ roomId });
    if (pageSize) params.append('pageSize', pageSize.toString());

    const response = await fetch(`${this.baseURL}/messages?${params}`, {
      method: 'GET',
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to list messages');

    const data = await response.json();

    // Transform reactions from backend format to frontend format
    // Backend: { emoji, count, users: string[] }
    // Frontend: { emoji, count, users: ReactionUser[], hasReacted: boolean }
    interface BackendReaction {
      emoji: string;
      count: number;
      users: string[];
    }
    interface BackendMessage extends Omit<Message, 'reactions'> {
      reactions?: BackendReaction[];
    }

    const items = data.items.map((msg: BackendMessage) => {
      if (!msg.reactions || msg.reactions.length === 0) {
        return msg as Message;
      }

      return {
        ...msg,
        reactions: msg.reactions.map(r => ({
          emoji: r.emoji,
          count: r.count,
          users: r.users.map(userId => ({ userId })),
          hasReacted: r.users.includes(this.userId),
        })),
      } as Message;
    });

    return { items, pageState: data.pageState };
  }

  async listThreadMessages(roomId: string, threadId: string, pageSize?: number): Promise<{ items: Message[]; pageState: string | null }> {
    const params = new URLSearchParams({ roomId, threadId });
    if (pageSize) params.append('pageSize', pageSize.toString());

    const response = await fetch(`${this.baseURL}/messages/thread?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to list thread messages');
    return response.json();
  }

  // ===== REACTION APIs =====

  async addReaction(messageId: string, emoji: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseURL}/messages/${encodeURIComponent(messageId)}/reactions`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emoji }),
    });
    if (!response.ok) throw new Error('Failed to add reaction');
    return response.json();
  }

  async removeReaction(messageId: string, emoji: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseURL}/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to remove reaction');
    return response.json();
  }

  async getReactions(messageId: string): Promise<Reaction[]> {
    const response = await fetch(`${this.baseURL}/messages/${encodeURIComponent(messageId)}/reactions`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to get reactions');
    return response.json();
  }

  // ===== MESSAGE EDIT/DELETE APIs =====

  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await fetch(`${this.baseURL}/messages/${encodeURIComponent(messageId)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to edit message');
    return response.json();
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseURL}/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to delete message');
    return response.json();
  }

  // ===== PIN APIs =====

  async pinMessage(messageId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseURL}/messages/${encodeURIComponent(messageId)}/pin`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to pin message');
    return response.json();
  }

  async unpinMessage(messageId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseURL}/messages/${encodeURIComponent(messageId)}/pin`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to unpin message');
    return response.json();
  }

  async getPinnedMessages(roomId: string): Promise<Message[]> {
    const response = await fetch(`${this.baseURL}/messages/pinned?roomId=${encodeURIComponent(roomId)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to get pinned messages');
    return response.json();
  }

  // ===== ATTACHMENT APIs =====

  async getPresignedUploadUrl(roomId: string, file: { fileName: string; mimeType: string; fileSize: number }): Promise<{
    uploadUrl: string;
    assetId: string;
    fileId: string;
  }> {
    const response = await fetch(`${this.baseURL}/messages/attachments/presigned-url`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomId,
        originalName: file.fileName,
        mimeType: file.mimeType,
        size: file.fileSize,
      }),
    });
    if (!response.ok) throw new Error('Failed to get presigned upload URL');
    const data = await response.json();
    // Map backend response fields to frontend expected fields
    return {
      uploadUrl: data.presignedUrl,
      assetId: data.assetId,
      fileId: data.assetId, // Use assetId as fileId
    };
  }

  async confirmUpload(messageId: string, assetId: string): Promise<Attachment> {
    const response = await fetch(`${this.baseURL}/messages/${encodeURIComponent(messageId)}/attachments/confirm`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assetId }),
    });
    if (!response.ok) throw new Error('Failed to confirm upload');
    return response.json();
  }

  async getAttachments(messageId: string): Promise<Attachment[]> {
    const response = await fetch(`${this.baseURL}/messages/${encodeURIComponent(messageId)}/attachments`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to get attachments');
    return response.json();
  }

  // ===== UNREAD COUNT APIs =====

  async getAllUnreadCounts(): Promise<UnreadCount[]> {
    const response = await fetch(`${this.baseURL}/notifications/unread`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to get unread counts');
    return response.json();
  }

  async markAsRead(roomId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseURL}/notifications/read/${encodeURIComponent(roomId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to mark as read');
    return response.json();
  }

  async markAllAsRead(roomId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseURL}/notifications/read-all/${encodeURIComponent(roomId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to mark all as read');
    return response.json();
  }

  // ===== CHANNEL MANAGEMENT APIs (UC01) =====

  async updateChannel(roomId: string, data: { name?: string; description?: string; isPrivate?: boolean }): Promise<Room> {
    const response = await fetch(`${this.baseURL}/rooms/${encodeURIComponent(roomId)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update channel');
    }
    return response.json();
  }

  async deleteChannel(roomId: string): Promise<{ deleted: boolean }> {
    const response = await fetch(`${this.baseURL}/rooms/${encodeURIComponent(roomId)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to delete channel');
    }
    return response.json();
  }

  async archiveChannel(roomId: string): Promise<{ archived: boolean }> {
    const response = await fetch(`${this.baseURL}/rooms/${encodeURIComponent(roomId)}/archive`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to archive channel');
    }
    return response.json();
  }

  async leaveChannel(roomId: string): Promise<{ left: boolean }> {
    const response = await fetch(`${this.baseURL}/rooms/${encodeURIComponent(roomId)}/leave`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to leave channel');
    }
    return response.json();
  }

  // ===== AI CONFIG APIs (UC03) =====

  async getAIConfig(roomId: string): Promise<AIConfig> {
    const response = await fetch(`${this.baseURL}/ai/config/${encodeURIComponent(roomId)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to get AI config');
    return response.json();
  }

  async updateAIConfig(roomId: string, data: Partial<AIConfigUpdate>): Promise<AIConfig> {
    const response = await fetch(`${this.baseURL}/ai/config/${encodeURIComponent(roomId)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update AI config');
    }
    return response.json();
  }

  async toggleAIFeature(roomId: string, feature: AIFeature, enabled: boolean): Promise<AIConfig> {
    const response = await fetch(`${this.baseURL}/ai/config/${encodeURIComponent(roomId)}/features/${encodeURIComponent(feature)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to toggle AI feature');
    }
    return response.json();
  }

  // ===== SEARCH APIs (UC10) =====

  async searchMessages(query: string, options?: SearchOptions): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.roomId) params.append('roomId', options.roomId);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.fromUserId) params.append('fromUserId', options.fromUserId);

    const response = await fetch(`${this.baseURL}/messages/search?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to search messages');
    return response.json();
  }

  async searchInRoom(roomId: string, query: string, options?: Omit<SearchOptions, 'roomId'>): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query });
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.fromUserId) params.append('fromUserId', options.fromUserId);

    const response = await fetch(`${this.baseURL}/messages/search/room/${encodeURIComponent(roomId)}?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to search in room');
    return response.json();
  }

  // ===== AI FEATURES APIs (UC11-UC14) =====

  async summarizeConversation(roomId: string, options?: { messageCount?: number; threadId?: string }): Promise<SummaryResult> {
    const response = await fetch(`${this.baseURL}/ai/summary/${encodeURIComponent(roomId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options || {}),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to summarize conversation');
    }
    return response.json();
  }

  async extractActionItems(roomId: string, options?: { messageCount?: number; threadId?: string }): Promise<ActionItemsResult> {
    const response = await fetch(`${this.baseURL}/ai/action-items/${encodeURIComponent(roomId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options || {}),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to extract action items');
    }
    return response.json();
  }

  async askQuestion(roomId: string, question: string, options?: { contextMessageCount?: number; threadId?: string }): Promise<QAResult> {
    const response = await fetch(`${this.baseURL}/ai/ask/${encodeURIComponent(roomId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question, ...options }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to ask question');
    }
    return response.json();
  }

  async summarizeDocument(roomId: string, attachmentId: string): Promise<DocumentSummaryResult> {
    const response = await fetch(`${this.baseURL}/ai/document-summary/${encodeURIComponent(roomId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ attachmentId }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to summarize document');
    }
    return response.json();
  }
}

// AI Config types
export type AIFeature = 'summary' | 'action_items' | 'qa' | 'document_summary';

export interface AIConfig {
  roomId: string;
  aiEnabled: boolean;
  enabledFeatures: AIFeature[];
  modelProvider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  customSystemPrompt: string | null;
  configuredBy: string | null;
  updatedAt: string | null;
}

export interface AIConfigUpdate {
  aiEnabled?: boolean;
  enabledFeatures?: AIFeature[];
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  customSystemPrompt?: string | null;
}

// Search types (UC10)
export interface SearchOptions {
  limit?: number;
  offset?: number;
  roomId?: string;
  startDate?: string;
  endDate?: string;
  fromUserId?: string;
}

export interface SearchResultItem {
  id: string;
  roomId: string;
  userId: string;
  threadId: string | null;
  content: string;
  type: string;
  createdAt: string;
  highlight?: string;
}

export interface SearchResult {
  query: string;
  roomId?: string;
  total: number;
  items: SearchResultItem[];
}

// AI Features types (UC11-UC14)
export interface SummaryResult {
  summary: string;
  messageCount: number;
}

export interface ActionItem {
  task: string;
  assignee?: string;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
}

export interface ActionItemsResult {
  items: ActionItem[];
  messageCount: number;
}

export interface QAResult {
  answer: string;
  sources?: Array<{
    messageId: string;
    content: string;
    userId: string;
    createdAt: string;
  }>;
}

export interface DocumentSummaryResult {
  summary: string;
  documentName: string;
  documentType: string;
}

export const api = new ApiService();
