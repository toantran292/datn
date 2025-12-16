'use client';

import { Sidebar } from './sidebar';
import { ChatWindow } from './chat';
import { DetailsPanel, ThreadView, MembersTab, FilesTab } from './details';
import { BrowseChannelsModal, CreateChannelModal, CreateDMModal } from './modals';
import { ChatLayout } from './layout';
import { api } from '../services/api';
import type { Room } from '../types';
import {
  useChatRooms,
  useChatMessages,
  useChatThreads,
  useChatSidebar,
  useChatModals,
} from '../hooks';

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
      }));
    } catch (error) {
      console.error('Failed to load members:', error);
      return [];
    }
  };

  // Helper to load files
  const loadFiles = async () => [];

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
          />
        }
        main={
          <ChatWindow
            room={rooms.isComposingDM ? rooms.composeDMRoom : rooms.selectedRoom}
            messages={messages.messages}
            currentUserId={messages.currentUserId}
            onSendMessage={messages.sendMessage}
            onLoadMessages={messages.loadMessages}
            onOpenThread={threads.openThread}
            onToggleSidebar={sidebar.toggle}
            sidebarOpen={sidebar.isOpen}
            usersCache={messages.usersCache}
            // Compose mode props
            isComposing={rooms.isComposingDM}
            composeUsers={rooms.composeUsers}
            onComposeUserSelect={rooms.addComposeUser}
            onComposeUserRemove={rooms.removeComposeUser}
            onComposeSendMessage={rooms.sendComposeMessage}
          />
        }
        details={
          sidebar.isOpen && rooms.selectedRoom && (
            <DetailsPanel
              room={rooms.selectedRoom}
              activeTab={sidebar.activeTab}
              onTabChange={sidebar.setTab}
              onClose={sidebar.close}
              threadContent={
                threads.activeThread ? (
                  <ThreadView
                    parentMessage={threads.activeThread}
                    threadMessages={threads.threadMessages}
                    currentUserId={messages.currentUserId}
                    onSendReply={threads.sendReply}
                    onClose={sidebar.close}
                    onLoadThread={threads.loadThread}
                    usersCache={messages.usersCache}
                  />
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
                    Click &quot;Reply&quot; on a message to start a thread
                  </div>
                )
              }
              membersContent={
                <MembersTab
                  roomId={rooms.selectedRoom.id}
                  onLoadMembers={() => loadMembers(rooms.selectedRoom!.id)}
                />
              }
              filesContent={
                <FilesTab
                  roomId={rooms.selectedRoom.id}
                  onLoadFiles={loadFiles}
                />
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
    </>
  );
}
