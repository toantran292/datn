'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './sidebar';
import { ChatWindow } from './chat';
import { DetailsPanel, ThreadView, MembersTab, FilesTab, PinnedTab, AISettingsTab } from './details';
import { BrowseChannelsModal, CreateChannelModal, CreateDMModal, EditMessageModal, ConfirmDeleteModal, SearchModal } from './modals';
import { ChatLayout } from './layout';
import { api } from '../services/api';
import type { Room, Message } from '../types';
import {
  useChatRooms,
  useChatMessages,
  useChatThreads,
  useChatSidebar,
  useChatModals,
} from '../hooks';
import { useUserProfile } from '@uts/design-system/ui';
import { EmbeddedHuddle } from './huddle';
import { useResponsive } from '../hooks/useResponsive';

/**
 * Main Chat Application Component - Pure UI Layer
 * All business logic is managed by ChatContext and custom hooks
 */
export function ChatApp() {
  // Domain-specific hooks
  const rooms = useChatRooms();
  const messages = useChatMessages();
  const threads = useChatThreads();
  const sidebar = useChatSidebar();
  const modals = useChatModals();
  const { data: userProfile } = useUserProfile();
  const { detailsPanelOpen, closeDetailsPanel, openDetailsPanel } = useResponsive();

  // Message action modals state
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Embedded huddle state
  const [huddleUrl, setHuddleUrl] = useState<string | null>(null);

  // Helper to get DM name
  const getDMName = (room: Room) => room.name || 'Direct Message';

  // Helper to load members
  const loadMembers = async (roomId: string) => {
    try {
      const members = await api.listRoomMembers(roomId);
      return members.map(m => ({
        userId: m.userId,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl,
        status: m.isOnline ? 'online' as const : 'offline' as const,
        role: m.role,
      }));
    } catch (error) {
      console.error('Failed to load members:', error);
      return [];
    }
  };

  // Check if current user is channel admin
  const [isChannelAdmin, setIsChannelAdmin] = useState(false);

  useEffect(() => {
    const checkChannelAdmin = async () => {
      if (!rooms.selectedRoom || rooms.selectedRoom.type === 'dm') {
        setIsChannelAdmin(false);
        return;
      }
      try {
        const members = await api.listRoomMembers(rooms.selectedRoom.id);
        const currentMember = members.find(m => m.userId === messages.currentUserId);
        setIsChannelAdmin(currentMember?.role === 'ADMIN');
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsChannelAdmin(false);
      }
    };
    checkChannelAdmin();
  }, [rooms.selectedRoom?.id, messages.currentUserId]);

  // Helper to load files
  const loadFiles = async () => [];

  // Helper to load pinned messages
  const loadPinnedMessages = async (roomId: string) => {
    try {
      return await api.getPinnedMessages(roomId);
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
      return [];
    }
  };

  // Thread handler - opens thread and details panel
  const handleOpenThread = useCallback((message: Message) => {
    threads.openThread(message);
    openDetailsPanel();
  }, [threads, openDetailsPanel]);

  // Message action handlers
  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
  };

  const handleDeleteMessage = (message: Message) => {
    setDeletingMessage(message);
  };

  const handlePinMessage = async (message: Message) => {
    try {
      await messages.pinMessage(message.id);
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };

  const handleUnpinMessage = async (message: Message) => {
    try {
      await messages.unpinMessage(message.id);
    } catch (error) {
      console.error('Failed to unpin message:', error);
    }
  };

  // Search handlers
  const handleOpenSearch = () => setIsSearchOpen(true);
  const handleCloseSearch = () => setIsSearchOpen(false);

  // Meeting handler - opens meet-web with user info
  const getMeetingUrl = (includeParams = false) => {
    if (!rooms.selectedRoom) return null;
    const meetBaseUrl = process.env.NEXT_PUBLIC_MEET_WEB_URL || 'http://localhost:3004';
    const orgId = rooms.selectedRoom?.orgId || '';

    // Determine subject type based on whether room has projectId
    const isProjectRoom = !!rooms.selectedRoom.projectId;
    const subjectType = isProjectRoom ? 'project' : 'chat';
    const subjectId = isProjectRoom ? rooms.selectedRoom.projectId! : rooms.selectedRoom.id;

    // Get user info from profile hook or messages context
    const userId = messages.currentUserId || userProfile?.userId || '';
    const userName = userProfile?.displayName || userProfile?.first_name || userProfile?.email || 'User';

    if (!includeParams) {
      // Simple URL for copying - recipient needs to auth themselves
      const params = new URLSearchParams({ subjectType, orgId });
      if (isProjectRoom) {
        params.set('projectId', subjectId);
      } else {
        params.set('chatId', subjectId);
      }
      return `${meetBaseUrl}/meet?${params.toString()}`;
    }

    // Only include user params if we have valid userId
    if (!userId) {
      console.warn('[Meeting] No userId available');
      return null;
    }

    // Build URL with params - goes directly to /meet which handles auto-join
    const params = new URLSearchParams({
      userId,
      userName,
      subjectType,
      orgId,
    });
    if (isProjectRoom) {
      params.set('projectId', subjectId);
    } else {
      params.set('chatId', subjectId);
    }

    return `${meetBaseUrl}/meet?${params.toString()}`;
  };

  const handleStartMeeting = useCallback(() => {
    const url = getMeetingUrl(true); // Include user params for auto-join
    if (url) {
      setHuddleUrl(url);
    }
  }, [rooms.selectedRoom, messages.currentUserId, userProfile]);

  const handleCloseHuddle = useCallback(() => {
    setHuddleUrl(null);
  }, []);

  const handleExpandHuddle = useCallback(() => {
    if (huddleUrl) {
      window.open(huddleUrl, '_blank');
      setHuddleUrl(null);
    }
  }, [huddleUrl]);

  const handleCopyMeetingLink = async () => {
    const url = getMeetingUrl(false); // Simple URL without user info
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        // Could add a toast notification here
      } catch (error) {
        console.error('Failed to copy meeting link:', error);
      }
    }
  };

  const handleNavigateToMessage = (roomId: string, messageId: string) => {
    // Navigate to the room containing the message
    rooms.selectRoom(roomId);
    // Scroll to the message after a short delay to allow room to load
    setTimeout(() => {
      scrollToMessage(messageId);
    }, 300);
  };

  // Scroll to a specific message
  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.classList.add('bg-custom-primary-100/20');
      setTimeout(() => {
        messageElement.classList.remove('bg-custom-primary-100/20');
      }, 2000);
    }
  };

  // Keyboard shortcut for search (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <ChatLayout
        sidebar={
          <Sidebar
            rooms={rooms.rooms}
            orgLevelRooms={rooms.orgLevelRooms}
            projectRooms={rooms.projectRooms}
            currentProjectId={rooms.currentProjectId}
            selectedRoomId={rooms.selectedRoomId}
            isComposingDM={rooms.isComposingDM}
            currentUserId={rooms.currentUserId}
            isOrgOwner={rooms.isOrgOwner}
            onSelectRoom={(roomId) => {
              // Cancel compose mode when selecting a room
              if (rooms.isComposingDM) {
                rooms.cancelCompose();
              }
              rooms.selectRoom(roomId);
            }}
            onCreateOrgChannel={modals.createChannel.openOrg}
            onCreateProjectChannel={modals.createChannel.openProject}
            onCreateDM={modals.createDM.open}
            onStartComposeDM={rooms.startComposingDM}
            onBrowseOrgChannels={modals.browse.openOrg}
            onBrowseProjectChannels={modals.browse.openProject}
            getDMName={getDMName}
            getUnreadCount={rooms.getUnreadCount}
            onRoomUpdated={rooms.updateRoom}
            onRoomDeleted={rooms.deleteRoom}
            onRoomArchived={rooms.archiveRoom}
            onLeftRoom={rooms.leaveRoom}
          />
        }
        main={
          <ChatWindow
            room={rooms.isComposingDM ? rooms.composeDMRoom : rooms.selectedRoom}
            messages={messages.messages}
            currentUserId={messages.currentUserId}
            onSendMessage={messages.sendMessage}
            onLoadMessages={messages.loadMessages}
            onLoadMoreMessages={messages.loadMoreMessages}
            hasMoreMessages={messages.hasMoreMessages}
            isLoadingMoreMessages={messages.isLoadingMoreMessages}
            onOpenThread={handleOpenThread}
            onToggleSidebar={sidebar.toggle}
            sidebarOpen={sidebar.isOpen}
            usersCache={messages.usersCache}
            // Compose mode props
            isComposing={rooms.isComposingDM}
            composeUsers={rooms.composeUsers}
            onComposeUserSelect={rooms.addComposeUser}
            onComposeUserRemove={rooms.removeComposeUser}
            onComposeSendMessage={rooms.sendComposeMessage}
            // Message actions
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onPinMessage={handlePinMessage}
            onUnpinMessage={handleUnpinMessage}
            onToggleReaction={messages.toggleReaction}
            // File upload
            pendingFiles={messages.pendingFiles}
            onFilesSelect={messages.selectFiles}
            onFileRemove={messages.removeFile}
            onOpenSearch={handleOpenSearch}
            onStartMeeting={handleStartMeeting}
            onCopyMeetingLink={handleCopyMeetingLink}
            huddleParticipantCounts={messages.huddleParticipantCounts}
            lastSeenMessageId={messages.lastSeenMessageId}
          />
        }
        details={
          rooms.selectedRoom && (
            <DetailsPanel
              room={rooms.selectedRoom}
              activeTab={sidebar.activeTab}
              onTabChange={sidebar.setTab}
              onClose={closeDetailsPanel}
              threadContent={
                threads.activeThread ? (
                  <ThreadView
                    parentMessage={threads.activeThread}
                    threadMessages={threads.threadMessages}
                    currentUserId={messages.currentUserId}
                    onSendReply={threads.sendReply}
                    onClose={closeDetailsPanel}
                    onLoadThread={threads.loadThread}
                    usersCache={messages.usersCache}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onPinMessage={handlePinMessage}
                    onUnpinMessage={handleUnpinMessage}
                    onToggleReaction={messages.toggleReaction}
                    roomId={rooms.selectedRoom?.id}
                  />
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
                    Nhấn &quot;Trả lời&quot; trên tin nhắn để bắt đầu thread
                  </div>
                )
              }
              membersContent={
                <MembersTab
                  roomId={rooms.selectedRoom.id}
                  roomName={rooms.selectedRoom.name || undefined}
                  currentUserId={messages.currentUserId}
                  canManageRoles={rooms.isOrgOwner || isChannelAdmin}
                  onLoadMembers={() => loadMembers(rooms.selectedRoom!.id)}
                />
              }
              filesContent={
                <FilesTab
                  roomId={rooms.selectedRoom.id}
                  onLoadFiles={loadFiles}
                />
              }
              pinnedContent={
                <PinnedTab
                  roomId={rooms.selectedRoom.id}
                  currentUserId={messages.currentUserId}
                  usersCache={messages.usersCache}
                  onLoadPinnedMessages={() => loadPinnedMessages(rooms.selectedRoom!.id)}
                  onUnpinMessage={handleUnpinMessage}
                  onScrollToMessage={scrollToMessage}
                />
              }
              aiContent={
                rooms.selectedRoom.type === 'channel' ? (
                  <AISettingsTab
                    roomId={rooms.selectedRoom.id}
                    canConfigure={rooms.isOrgOwner || isChannelAdmin}
                    onNavigateToMessage={scrollToMessage}
                  />
                ) : null
              }
            />
          )
        }
      />

      {/* Browse Channels Modal */}
      <BrowseChannelsModal
        isOpen={modals.browse.isOpen}
        onClose={modals.browse.close}
        onJoinRoom={rooms.joinRoom}
        onLoadPublicRooms={rooms.browsePublicRooms}
        joinedRoomIds={new Set(rooms.rooms.map(r => r.id))}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={modals.createChannel.isOpen}
        onClose={modals.createChannel.close}
        onCreate={rooms.createChannel}
      />

      {/* Create DM Modal */}
      <CreateDMModal
        isOpen={modals.createDM.isOpen}
        onClose={modals.createDM.close}
        onCreate={rooms.createDM}
        currentUserId={messages.currentUserId}
      />

      {/* Edit Message Modal */}
      <EditMessageModal
        isOpen={!!editingMessage}
        message={editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={messages.editMessage}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingMessage}
        message={deletingMessage}
        onClose={() => setDeletingMessage(null)}
        onConfirm={messages.deleteMessage}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        rooms={rooms.rooms}
        onNavigateToMessage={handleNavigateToMessage}
        usersCache={messages.usersCache}
      />

      {/* Embedded Huddle */}
      {huddleUrl && (
        <EmbeddedHuddle
          meetingUrl={huddleUrl}
          onClose={handleCloseHuddle}
          onExpand={handleExpandHuddle}
        />
      )}
    </>
  );
}
