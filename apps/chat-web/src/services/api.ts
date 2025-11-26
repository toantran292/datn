import type { Room, Message } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiService {
  private userId: string = '';
  private orgId: string = '';

  setAuth(userId: string, orgId: string) {
    this.userId = userId;
    this.orgId = orgId;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-User-ID': this.userId,
      'X-Org-ID': this.orgId,
    };
  }

  async createRoom(name: string, isPrivate: boolean): Promise<Room> {
    const response = await fetch(`${API_URL}/api/chat/rooms`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, isPrivate }),
    });
    if (!response.ok) throw new Error('Failed to create room');
    return response.json();
  }

  async listRooms(limit?: number): Promise<{ items: Room[]; pagingState: string | null }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${API_URL}/api/chat/rooms?${params}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to list rooms');
    return response.json();
  }

  async joinRoom(roomId: string): Promise<{ joined: boolean }> {
    const response = await fetch(`${API_URL}/api/chat/rooms/join`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ roomId }),
    });
    if (!response.ok) throw new Error('Failed to join room');
    return response.json();
  }

  async listMessages(roomId: string, pageSize?: number): Promise<{ items: Message[]; pageState: string | null }> {
    const params = new URLSearchParams({ roomId });
    if (pageSize) params.append('pageSize', pageSize.toString());

    const response = await fetch(`${API_URL}/api/chat/messages?${params}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to list messages');
    return response.json();
  }
}

export const api = new ApiService();
