import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import type { Message, Room } from '../../types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export interface ChatWindowProps {
  room: Room | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onLoadMessages: () => void;
  onOpenThread: (message: Message) => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function ChatWindow({
  room,
  messages,
  currentUserId,
  onSendMessage,
  onLoadMessages,
  onOpenThread,
  onToggleSidebar,
  sidebarOpen
}: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (room) {
      onLoadMessages();
    }
  }, [room?.id]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    onSendMessage(messageInput);
    setMessageInput('');
  };

  // Empty state
  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-custom-background-100">
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-custom-background-80 flex items-center justify-center">
            <MessageSquare size={32} className="text-custom-text-300" />
          </div>
          <h3 className="text-lg font-semibold text-custom-text-100 mb-1">
            Select a conversation
          </h3>
          <p className="text-sm text-custom-text-300">
            Choose a channel or direct message to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-custom-background-100 min-w-0">
      <ChatHeader
        room={room}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
      />

      <MessageList
        room={room}
        messages={messages}
        currentUserId={currentUserId}
        onOpenThread={onOpenThread}
      />

      <MessageInput
        room={room}
        value={messageInput}
        onChange={setMessageInput}
        onSubmit={handleSendMessage}
      />
    </div>
  );
}
