import type { Room, Message } from '../types';
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

  async listOrgUsers(): Promise<Array<{
    userId: string;
    email: string;
    displayName: string;
    disabled: boolean;
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
    return response.json();
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
}

export const api = new ApiService();
