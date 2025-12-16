'use client';

import { useChatContext } from '../contexts/ChatContext';

/**
 * Hook to manage message-related operations
 */
export function useChatMessages() {
  const {
    messages,
    handleLoadMessages,
    handleSendMessage,
    currentUserId,
    usersCache,
  } = useChatContext();

  return {
    messages,
    loadMessages: handleLoadMessages,
    sendMessage: handleSendMessage,
    currentUserId,
    usersCache,
  };
}
