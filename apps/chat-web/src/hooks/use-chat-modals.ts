'use client';

import { useChatContext } from '../contexts/ChatContext';

/**
 * Hook to manage modal visibility
 */
export function useChatModals() {
  const {
    showBrowseModal,
    showCreateChannelModal,
    showCreateDMModal,
    setShowBrowseModal,
    setShowCreateChannelModal,
    setShowCreateDMModal,
  } = useChatContext();

  return {
    browse: {
      isOpen: showBrowseModal,
      open: () => setShowBrowseModal(true),
      close: () => setShowBrowseModal(false),
    },
    createChannel: {
      isOpen: showCreateChannelModal,
      open: () => setShowCreateChannelModal(true),
      close: () => setShowCreateChannelModal(false),
    },
    createDM: {
      isOpen: showCreateDMModal,
      open: () => setShowCreateDMModal(true),
      close: () => setShowCreateDMModal(false),
    },
  };
}
