'use client';

import { RoomsList } from './left-sidebar/RoomsList';
import { ChatWindow } from './main/ChatWindow';
import { RightSidebar } from './right-sidebar/RightSidebar';
import { ThreadView } from './right-sidebar/ThreadView';
import { MembersTab } from './right-sidebar/MembersTab';
import { FilesTab } from './right-sidebar/FilesTab';
import { BrowseChannelsModal } from './left-sidebar/components/BrowseChannelsModal';
import { CreateChannelModal } from './left-sidebar/components/CreateChannelModal';
import { CreateDMModal } from './left-sidebar/components/CreateDMModal';
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
      <div className="flex h-full w-full overflow-hidden">
        {/* Left Sidebar - Rooms List */}
        <RoomsList
          rooms={rooms.rooms}
          orgLevelRooms={rooms.orgLevelRooms}
          projectRooms={rooms.projectRooms}
          currentProjectId={rooms.currentProjectId}
          selectedRoomId={rooms.selectedRoomId}
          onSelectRoom={rooms.selectRoom}
          onCreateOrgChannel={modals.createChannel.openOrg}
          onCreateProjectChannel={modals.createChannel.openProject}
          onCreateDM={modals.createDM.open}
          onBrowseOrgChannels={modals.browse.openOrg}
          onBrowseProjectChannels={modals.browse.openProject}
          getDMName={getDMName}
        />

        {/* Center - Chat Window */}
        <ChatWindow
          room={rooms.selectedRoom}
          messages={messages.messages}
          currentUserId={messages.currentUserId}
          onSendMessage={messages.sendMessage}
          onLoadMessages={messages.loadMessages}
          onOpenThread={threads.openThread}
          onToggleSidebar={sidebar.toggle}
          sidebarOpen={sidebar.isOpen}
        />

        {/* Right Sidebar - Channel Detail with Tabs */}
        {sidebar.isOpen && rooms.selectedRoom && (
          <RightSidebar
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
        )}
      </div>

      {/* Browse Channels Modal */}
      {modals.browse.isOpen && (
        <BrowseChannelsModal
          onClose={modals.browse.close}
          onJoinRoom={rooms.joinRoom}
          onLoadPublicRooms={rooms.browsePublicRooms}
          joinedRoomIds={new Set(rooms.rooms.map(r => r.id))}
        />
      )}

      {/* Create Channel Modal */}
      {modals.createChannel.isOpen && (
        <CreateChannelModal
          onClose={modals.createChannel.close}
          onCreate={rooms.createChannel}
        />
      )}

      {/* Create DM Modal */}
      {modals.createDM.isOpen && (
        <CreateDMModal
          onClose={modals.createDM.close}
          onCreate={rooms.createDM}
          currentUserId={messages.currentUserId}
        />
      )}
    </>
  );
}
