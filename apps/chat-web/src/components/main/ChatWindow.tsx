import { useState, useEffect, useRef } from 'react';
import type { Message, Room } from '../../types';

interface ChatWindowProps {
  room: Room | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onLoadMessages: () => void;
  onOpenThread: (message: Message) => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function ChatWindow({ room, messages, currentUserId, onSendMessage, onLoadMessages, onOpenThread, onToggleSidebar, sidebarOpen }: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (room) {
      onLoadMessages();
    }
  }, [room?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    onSendMessage(messageInput);
    setMessageInput('');
  };

  if (!room) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        Select a room to start chatting
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#fafafa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {room.name || 'Unnamed Room'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>
            {room.isPrivate ? '🔒 Private' : '🌐 Public'} • {room.id.slice(0, 8)}...
          </p>
        </div>

        {/* Toggle Sidebar Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            style={{
              padding: '8px 16px',
              backgroundColor: sidebarOpen ? '#2196f3' : 'white',
              color: sidebarOpen ? 'white' : '#666',
              border: sidebarOpen ? 'none' : '1px solid #e0e0e0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            title="Channel details"
          >
            <span>ℹ️</span>
            <span>Details</span>
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center' }}>No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.userId === currentUserId;
          const isHovered = hoveredMessageId === msg.id;
          // Only show main messages (not thread replies)
          if (msg.threadId) return null;

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start',
                position: 'relative',
              }}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: isOwn ? '#2196f3' : '#e0e0e0',
                  color: isOwn ? 'white' : 'black',
                  position: 'relative',
                }}
              >
                {!isOwn && (
                  <div style={{ fontSize: '11px', marginBottom: '4px', opacity: 0.8 }}>
                    User: {msg.userId.slice(0, 8)}...
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                  {new Date(msg.sentAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Thread Reply Button */}
              {isHovered && (
                <button
                  onClick={() => onOpenThread(msg)}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: isOwn ? 'auto' : '8px',
                    left: isOwn ? '8px' : 'auto',
                    padding: '4px 10px',
                    fontSize: '11px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 10,
                  }}
                  title="Reply in thread"
                >
                  💬 Reply
                </button>
              )}

              {/* Thread Reply Count */}
              {msg.replyCount && msg.replyCount > 0 ? (
                <button
                  onClick={() => onOpenThread(msg)}
                  style={{
                    marginTop: '4px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#2196f3',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  💬 {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
                </button>
              ) : null}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '16px', borderTop: '1px solid #ccc', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Send
        </button>
      </form>
    </div>
  );
}
