'use client';

import { useChatContext } from '../contexts/ChatContext';

/**
 * Hook to manage thread-related operations
 */
export function useChatThreads() {
  const {
    activeThread,
    threadMessages,
    handleOpenThread,
    handleLoadThread,
    handleSendThreadReply,
  } = useChatContext();

  return {
    activeThread,
    threadMessages,
    openThread: handleOpenThread,
    loadThread: handleLoadThread,
    sendReply: handleSendThreadReply,
  };
}
