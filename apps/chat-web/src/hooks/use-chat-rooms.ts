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
    // Compose DM
    isComposingDM,
    composeUsers,
    composeDMRoom,
    startComposingDM,
    addComposeUser,
    removeComposeUser,
    cancelCompose,
    handleSendComposeMessage,
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

    // Compose DM
    isComposingDM,
    composeUsers,
    composeDMRoom,
    startComposingDM,
    addComposeUser,
    removeComposeUser,
    cancelCompose,
    sendComposeMessage: handleSendComposeMessage,
  };
}
