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
    // This will call Identity service through backend
    const response = await fetch(`${this.baseURL}/internal/orgs/${this.orgId}/users`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) throw new Error('Failed to list org users');
    return response.json();
  }

  async listJoinedRooms(limit?: number, projectId?: string | null): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (projectId !== undefined) {
      // null means org-level only, string means project-specific only
      params.append('project_id', projectId || '');
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
        'X-User-ID': this.userId,
        'X-Org-ID': this.orgId,
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
