'use client';

import { useChatContext } from '../contexts/ChatContext';

/**
 * Hook to manage message-related operations
 */
export function useChatMessages() {
  const {
    messages,
    handleLoadMessages,
    handleLoadMoreMessages,
    hasMoreMessages,
    isLoadingMoreMessages,
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
    loadMoreMessages: handleLoadMoreMessages,
    hasMoreMessages,
    isLoadingMoreMessages,
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
