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
    setBrowseScope,
    setCreateChannelScope,
  } = useChatContext();

  return {
    browse: {
      isOpen: showBrowseModal,
      openOrg: () => {
        setBrowseScope('org');
        setShowBrowseModal(true);
      },
      openProject: () => {
        setBrowseScope('project');
        setShowBrowseModal(true);
      },
      close: () => setShowBrowseModal(false),
    },
    createChannel: {
      isOpen: showCreateChannelModal,
      openOrg: () => {
        setCreateChannelScope('org');
        setShowCreateChannelModal(true);
      },
      openProject: () => {
        setCreateChannelScope('project');
        setShowCreateChannelModal(true);
      },
      close: () => setShowCreateChannelModal(false),
    },
    createDM: {
      isOpen: showCreateDMModal,
      open: () => setShowCreateDMModal(true),
      close: () => setShowCreateDMModal(false),
    },
  };
}
