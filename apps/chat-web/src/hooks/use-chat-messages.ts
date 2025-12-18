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
    handleEditMessage,
    handleDeleteMessage,
    handlePinMessage,
    handleUnpinMessage,
    handleToggleReaction,
    currentUserId,
    usersCache,
    // File upload
    pendingFiles,
    handleFilesSelect,
    handleFileRemove,
    // Huddle
    huddleParticipantCounts,
    // Unread divider
    lastSeenMessageId,
  } = useChatContext();

  return {
    messages,
    loadMessages: handleLoadMessages,
    sendMessage: handleSendMessage,
    editMessage: handleEditMessage,
    deleteMessage: handleDeleteMessage,
    pinMessage: handlePinMessage,
    unpinMessage: handleUnpinMessage,
    toggleReaction: handleToggleReaction,
    currentUserId,
    usersCache,
    // File upload
    pendingFiles,
    selectFiles: handleFilesSelect,
    removeFile: handleFileRemove,
    // Huddle
    huddleParticipantCounts,
    // Unread divider
    lastSeenMessageId,
  };
}
