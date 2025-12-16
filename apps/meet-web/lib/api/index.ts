/**
 * API Module exports
 *
 * Usage:
 * import { getMeetingToken, startRecording } from '@/lib/api';
 *
 * Or import specific modules:
 * import * as MeetingAPI from '@/lib/api/meetings';
 */

// Re-export all types
export * from './types';

// Re-export API client
export { ApiError, API_URL } from './client';

// Re-export all API functions
export * from './meetings';
export * from './recordings';
export * from './summaries';
