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

  async listMessages(roomId: string, pageSize?: number, pageState?: string): Promise<{ items: Message[]; pageState: string | null }> {
    const params = new URLSearchParams({ roomId });
    if (pageSize) params.append('pageSize', pageSize.toString());
    if (pageState) params.append('pageState', pageState);

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

  // ===== AI STREAMING APIs =====

  /**
   * Stream summarize conversation using Server-Sent Events
   */
  streamSummarizeConversation(
    roomId: string,
    options?: { messageCount?: number; threadId?: string },
    callbacks?: {
      onChunk?: (chunk: string) => void;
      onDone?: (messageCount: number) => void;
      onError?: (error: string) => void;
    },
  ): { abort: () => void } {
    const params = new URLSearchParams();
    if (options?.messageCount) params.append('messageCount', options.messageCount.toString());
    if (options?.threadId) params.append('threadId', options.threadId);

    const url = `${this.baseURL}/ai/stream/summary/${encodeURIComponent(roomId)}?${params}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chunk') {
          callbacks?.onChunk?.(data.data);
        } else if (data.type === 'done') {
          callbacks?.onDone?.(data.messageCount || 0);
          eventSource.close();
        } else if (data.type === 'error') {
          callbacks?.onError?.(data.data);
          eventSource.close();
        }
      } catch {
        // Ignore parsing errors
      }
    };

    eventSource.onerror = () => {
      callbacks?.onError?.('Connection error');
      eventSource.close();
    };

    return {
      abort: () => eventSource.close(),
    };
  }

  /**
   * Stream extract action items using Server-Sent Events
   */
  streamExtractActionItems(
    roomId: string,
    options?: { messageCount?: number; threadId?: string },
    callbacks?: {
      onChunk?: (chunk: string) => void;
      onDone?: (messageCount: number) => void;
      onError?: (error: string) => void;
    },
  ): { abort: () => void } {
    const params = new URLSearchParams();
    if (options?.messageCount) params.append('messageCount', options.messageCount.toString());
    if (options?.threadId) params.append('threadId', options.threadId);

    const url = `${this.baseURL}/ai/stream/action-items/${encodeURIComponent(roomId)}?${params}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chunk') {
          callbacks?.onChunk?.(data.data);
        } else if (data.type === 'done') {
          callbacks?.onDone?.(data.messageCount || 0);
          eventSource.close();
        } else if (data.type === 'error') {
          callbacks?.onError?.(data.data);
          eventSource.close();
        }
      } catch {
        // Ignore parsing errors
      }
    };

    eventSource.onerror = () => {
      callbacks?.onError?.('Connection error');
      eventSource.close();
    };

    return {
      abort: () => eventSource.close(),
    };
  }

  /**
   * Stream Q&A using Server-Sent Events
   */
  streamAskQuestion(
    roomId: string,
    question: string,
    options?: { contextMessageCount?: number; threadId?: string },
    callbacks?: {
      onSources?: (sources: Array<{ messageId: string; content: string; userId: string; createdAt: string }>) => void;
      onChunk?: (chunk: string) => void;
      onDone?: () => void;
      onError?: (error: string) => void;
    },
  ): { abort: () => void } {
    const params = new URLSearchParams({ question });
    if (options?.contextMessageCount) params.append('contextMessageCount', options.contextMessageCount.toString());
    if (options?.threadId) params.append('threadId', options.threadId);

    const url = `${this.baseURL}/ai/stream/ask/${encodeURIComponent(roomId)}?${params}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'sources') {
          callbacks?.onSources?.(data.sources || []);
        } else if (data.type === 'chunk') {
          callbacks?.onChunk?.(data.data);
        } else if (data.type === 'done') {
          callbacks?.onDone?.();
          eventSource.close();
        } else if (data.type === 'error') {
          callbacks?.onError?.(data.data);
          eventSource.close();
        }
      } catch {
        // Ignore parsing errors
      }
    };

    eventSource.onerror = () => {
      callbacks?.onError?.('Connection error');
      eventSource.close();
    };

    return {
      abort: () => eventSource.close(),
    };
  }

  /**
   * Stream document summary using Server-Sent Events
   * @param regenerate - Force regenerate even if cached
   */
  streamDocumentSummary(
    roomId: string,
    attachmentId: string,
    callbacks?: {
      onChunk?: (chunk: string) => void;
      onCached?: (summary: string, documentName: string, documentType: string, transcription?: string) => void;
      onDone?: (documentName: string, documentType: string, transcription?: string) => void;
      onError?: (error: string) => void;
    },
    regenerate: boolean = false,
  ): { abort: () => void } {
    const params = new URLSearchParams({ attachmentId });
    if (regenerate) {
      params.append('regenerate', 'true');
    }

    const url = `${this.baseURL}/ai/stream/document-summary/${encodeURIComponent(roomId)}?${params}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'cached') {
          callbacks?.onCached?.(data.data, data.documentName || '', data.documentType || '', data.transcription);
          eventSource.close();
        } else if (data.type === 'chunk') {
          callbacks?.onChunk?.(data.data);
        } else if (data.type === 'done') {
          callbacks?.onDone?.(data.documentName || '', data.documentType || '', data.transcription);
          eventSource.close();
        } else if (data.type === 'error') {
          callbacks?.onError?.(data.data);
          eventSource.close();
        }
      } catch {
        // Ignore parsing errors
      }
    };

    eventSource.onerror = () => {
      callbacks?.onError?.('Connection error');
      eventSource.close();
    };

    return {
      abort: () => eventSource.close(),
    };
  }

  // ===== RAG Indexing APIs =====

  /**
   * Index all messages in a specific room for RAG
   */
  async indexRoom(roomId: string): Promise<{ indexed: number; skipped: number; errors: string[] }> {
    const response = await fetch(`${this.baseURL}/ai/rag/index-room/${encodeURIComponent(roomId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to index room');
    }
    return response.json();
  }

  /**
   * Index all rooms in the organization for RAG
   */
  async indexAllRooms(): Promise<{
    totalRooms: number;
    successfulRooms: number;
    totalIndexed: number;
    totalSkipped: number;
    errors: string[];
  }> {
    const response = await fetch(`${this.baseURL}/ai/rag/index-all-rooms`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to index all rooms');
    }
    return response.json();
  }

  /**
   * Get RAG indexing stats for a room
   */
  async getRoomRAGStats(roomId: string): Promise<{ totalEmbeddings: number }> {
    const response = await fetch(`${this.baseURL}/ai/rag/stats/${encodeURIComponent(roomId)}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to get RAG stats');
    }
    return response.json();
  }

  /**
   * Clear all embeddings for a room
   */
  async clearRoomEmbeddings(roomId: string): Promise<{ deleted: number }> {
    const response = await fetch(`${this.baseURL}/ai/rag/embeddings/${encodeURIComponent(roomId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to clear embeddings');
    }
    return response.json();
  }

  // ===== TRANSCRIPT APIs (Meeting Captions) =====

  /**
   * Get transcript files list for a meeting from S3
   */
  async getMeetingTranscriptsFromS3(meetingId: string): Promise<TranscriptFile[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/chat', '') || 'http://localhost:8080';
    const response = await fetch(`${baseUrl}/transcripts/meeting/${encodeURIComponent(meetingId)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.transcripts || [];
  }

  /**
   * Get transcript content from S3 file
   */
  async getTranscriptContentFromS3(fileId: string): Promise<TranscriptContent | null> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/chat', '') || 'http://localhost:8080';
    const response = await fetch(`${baseUrl}/transcripts/${encodeURIComponent(fileId)}/content`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      meetingId: data.meetingId,
      roomId: data.roomId,
      entries: (data.entries || []).map((e: any) => ({
        speakerId: e.speakerId,
        speakerName: e.speakerName,
        text: e.text,
        translatedText: e.translatedText,
        translatedLang: e.translatedLang,
        timestamp: e.timestamp,
        isFinal: e.isFinal,
      })),
    };
  }

  /**
   * Get transcript entries for a meeting - tries S3 first, falls back to DB
   */
  async getMeetingTranscript(meetingId: string): Promise<TranscriptContent> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/chat', '') || 'http://localhost:8080';

    // Try S3 first
    const s3Files = await this.getMeetingTranscriptsFromS3(meetingId);
    if (s3Files.length > 0) {
      // Get content from the most recent file
      const content = await this.getTranscriptContentFromS3(s3Files[0].fileId);
      if (content && content.entries.length > 0) {
        return content;
      }
    }

    // Fallback to DB
    const response = await fetch(`${baseUrl}/ai/meetings/${encodeURIComponent(meetingId)}/transcript`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to get meeting transcript');
    const data = await response.json();

    // Transform from DB format to frontend format
    const entries: TranscriptEntry[] = (data.entries || []).map((entry: any) => ({
      speakerId: entry.speakerId,
      speakerName: entry.speakerName,
      text: entry.originalText,
      translatedText: entry.translatedText,
      translatedLang: entry.translatedLang,
      timestamp: entry.startTime,
      isFinal: entry.isFinal,
    }));

    return {
      meetingId,
      roomId: '',
      entries,
    };
  }

  /**
   * Get transcript as plain text
   */
  async getMeetingTranscriptText(meetingId: string, lang?: string): Promise<string> {
    // Try to get from S3 first
    const content = await this.getMeetingTranscript(meetingId);
    if (content.entries.length > 0) {
      // Format entries as text
      return content.entries
        .map(e => `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.speakerName || 'Unknown'}: ${e.text}`)
        .join('\n');
    }

    // Fallback to DB text format
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/chat', '') || 'http://localhost:8080';
    const params = new URLSearchParams({ format: 'text' });
    if (lang) params.append('lang', lang);

    const response = await fetch(`${baseUrl}/ai/meetings/${encodeURIComponent(meetingId)}/transcript?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to get meeting transcript text');
    const data = await response.json();
    return data.text || '';
  }

  // ===== RECORDING APIs (Meeting Recordings) =====

  /**
   * Get all recordings for a meeting
   */
  async getMeetingRecordings(meetingId: string): Promise<MeetingRecording[]> {
    const meetApiUrl = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600';
    try {
      const response = await fetch(`${meetApiUrl}/recordings/meeting/${encodeURIComponent(meetingId)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.recordings || []).map((r: any) => ({
        recordingId: r.recording_id,
        sessionId: r.session_id,
        meetingId: r.meeting_id,
        status: r.status,
        startedAt: r.started_at,
        stoppedAt: r.stopped_at,
        duration: r.duration,
        fileSize: r.file_size,
        s3Url: r.s3_url,
      }));
    } catch (error) {
      console.error('[API] Failed to get meeting recordings:', error);
      return [];
    }
  }

  /**
   * Get a single recording by ID
   */
  async getRecording(recordingId: string): Promise<MeetingRecording | null> {
    const meetApiUrl = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600';
    try {
      const response = await fetch(`${meetApiUrl}/recordings/${encodeURIComponent(recordingId)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) return null;
      const r = await response.json();
      return {
        recordingId: r.recording_id,
        sessionId: r.session_id,
        meetingId: r.meeting_id,
        status: r.status,
        startedAt: r.started_at,
        stoppedAt: r.stopped_at,
        duration: r.duration,
        fileSize: r.file_size,
        s3Url: r.s3_url,
      };
    } catch (error) {
      console.error('[API] Failed to get recording:', error);
      return null;
    }
  }

  /**
   * Get AI summary of meeting transcript
   */
  async getMeetingSummary(meetingId: string, lang?: string): Promise<string | null> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/chat', '') || 'http://localhost:8080';
    const params = new URLSearchParams();
    if (lang) params.append('lang', lang);

    try {
      const response = await fetch(`${baseUrl}/ai/meetings/${encodeURIComponent(meetingId)}/summary?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.summary || null;
    } catch (error) {
      console.error('[API] Failed to get meeting summary:', error);
      return null;
    }
  }

  /**
   * Stream AI summary of meeting transcript
   * Returns EventSource URL for SSE streaming
   */
  getMeetingSummaryStreamUrl(meetingId: string, lang?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/chat', '') || 'http://localhost:8080';
    const params = new URLSearchParams();
    if (lang) params.append('lang', lang);
    return `${baseUrl}/ai/meetings/${encodeURIComponent(meetingId)}/summary/stream?${params}`;
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

// Transcript types
export interface TranscriptEntry {
  speakerId: string;
  speakerName?: string;
  text: string;
  translatedText?: string;
  translatedLang?: string;
  timestamp: string;
  isFinal: boolean;
}

export interface TranscriptFile {
  id: string;
  meetingId: string;
  fileId: string;
  fileName: string;
  entryCount: number;
  createdAt: string;
}

export interface TranscriptContent {
  meetingId: string;
  roomId: string;
  entries: TranscriptEntry[];
}

// Recording types
export type RecordingStatus = 'PENDING' | 'RECORDING' | 'STOPPED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface MeetingRecording {
  recordingId: string;
  sessionId: string;
  meetingId?: string;
  status: RecordingStatus;
  startedAt?: string;
  stoppedAt?: string;
  duration?: number;
  fileSize?: number;
  s3Url?: string;
}

export const api = new ApiService();
