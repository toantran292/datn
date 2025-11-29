import type { Room } from '../types';

/**
 * Type guard to validate Room response from backend
 */
export function isValidRoom(data: any): data is Room {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.orgId === 'string' &&
    typeof data.isPrivate === 'boolean' &&
    (data.type === 'channel' || data.type === 'dm') &&
    (data.name === null || data.name === undefined || typeof data.name === 'string') &&
    (data.projectId === null || data.projectId === undefined || typeof data.projectId === 'string')
  );
}

/**
 * Validate Room response and throw if invalid
 */
export function validateRoomResponse(data: any, context: string): Room {
  if (!isValidRoom(data)) {
    console.error(`[${context}] Invalid room response:`, data);
    throw new Error(`Invalid room data received from backend (${context})`);
  }
  return data;
}
