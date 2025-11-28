import type { Room, Message } from '../types';

class ApiService {
  private userId: string = '';
  private orgId: string = '';

  setAuth(userId: string, orgId: string) {
    this.userId = userId;
    this.orgId = orgId;
  }

  async createRoom(name: string, isPrivate: boolean): Promise<Room> {
    // Use relative path to leverage Vite proxy
    const response = await fetch('/chat/rooms', {
      method: 'POST',
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': this.userId,
        'X-Org-ID': this.orgId,
      },
      body: JSON.stringify({ name, is_private: isPrivate }),
    });
    if (!response.ok) throw new Error('Failed to create room');
    return response.json();
  }

  async createChannel(name: string, isPrivate: boolean = false): Promise<Room> {
    const response = await fetch('/chat/rooms/channel', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': this.userId,
        'X-Org-ID': this.orgId,
      },
      body: JSON.stringify({ name, is_private: isPrivate }),
    });
    if (!response.ok) throw new Error('Failed to create channel');
    return response.json();
  }

  async createDM(userIds: string[]): Promise<Room> {
    const response = await fetch('/chat/rooms/dm', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': this.userId,
        'X-Org-ID': this.orgId,
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
    const response = await fetch(`/chat/internal/orgs/${this.orgId}/users`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': this.userId,
        'X-Org-ID': this.orgId,
      },
    });
    if (!response.ok) throw new Error('Failed to list org users');
    return response.json();
  }

  async listJoinedRooms(limit?: number): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`/chat/rooms?${params}`, {
      method: 'GET',
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': this.userId,
        'X-Org-ID': this.orgId,
      },
    });
    if (!response.ok) throw new Error('Failed to list joined rooms');
    return response.json();
  }

  async browsePublicRooms(limit?: number): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`/chat/rooms/browse?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': this.userId,
        'X-Org-ID': this.orgId,
      },
    });
    if (!response.ok) throw new Error('Failed to browse public rooms');
    return response.json();
  }

  async joinRoom(roomId: string): Promise<{ joined: boolean }> {
    const response = await fetch('/chat/rooms/join', {
      method: 'POST',
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': this.userId,
        'X-Org-ID': this.orgId,
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
    const response = await fetch(`/chat/rooms/${encodeURIComponent(roomId)}/members`, {
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

    const response = await fetch(`/chat/messages?${params}`, {
      method: 'GET',
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': this.userId,
        'X-Org-ID': this.orgId,
      },
    });
    if (!response.ok) throw new Error('Failed to list messages');
    return response.json();
  }

  async listThreadMessages(roomId: string, threadId: string, pageSize?: number): Promise<{ items: Message[]; pageState: string | null }> {
    const params = new URLSearchParams({ roomId, threadId });
    if (pageSize) params.append('pageSize', pageSize.toString());

    const response = await fetch(`/chat/messages/thread?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': this.userId,
        'X-Org-ID': this.orgId,
      },
    });
    if (!response.ok) throw new Error('Failed to list thread messages');
    return response.json();
  }
}

export const api = new ApiService();
