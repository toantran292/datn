'use client';

import { useChatContext } from '../contexts/ChatContext';

/**
 * Hook to manage room-related operations
 */
export function useChatRooms() {
  const {
    rooms,
    selectedRoomId,
    selectedRoom,
    currentProjectId,
    orgLevelRooms,
    projectRooms,
    loadRooms,
    handleSelectRoom,
    handleBrowsePublicRooms,
    handleJoinRoomFromBrowse,
    handleCreateChannel,
    handleCreateDM,
    // Room management
    handleUpdateRoom,
    handleDeleteRoom,
    handleArchiveRoom,
    handleLeaveRoom,
    // Compose DM
    isComposingDM,
    composeUsers,
    composeDMRoom,
    startComposingDM,
    addComposeUser,
    removeComposeUser,
    cancelCompose,
    handleSendComposeMessage,
    // Unread
    getUnreadCount,
    // User
    currentUserId,
    isOrgOwner,
  } = useChatContext();

  return {
    // All rooms
    rooms,

    // Filtered rooms
    orgLevelRooms,
    projectRooms,

    // Current context
    currentProjectId,
    selectedRoomId,
    selectedRoom,

    // Actions
    loadRooms,
    selectRoom: handleSelectRoom,
    browsePublicRooms: handleBrowsePublicRooms,
    joinRoom: handleJoinRoomFromBrowse,
    createChannel: handleCreateChannel,
    createDM: handleCreateDM,

    // Room management
    updateRoom: handleUpdateRoom,
    deleteRoom: handleDeleteRoom,
    archiveRoom: handleArchiveRoom,
    leaveRoom: handleLeaveRoom,

    // User
    currentUserId,
    isOrgOwner,

    // Compose DM
    isComposingDM,
    composeUsers,
    composeDMRoom,
    startComposingDM,
    addComposeUser,
    removeComposeUser,
    cancelCompose,
    sendComposeMessage: handleSendComposeMessage,

    // Unread
    getUnreadCount,
  };
}
