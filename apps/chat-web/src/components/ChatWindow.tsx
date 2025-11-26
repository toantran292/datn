import { useState, useEffect, useRef } from 'react';
import type { Message, Room } from '../types';

interface ChatWindowProps {
  room: Room | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onLoadMessages: () => void;
}

export function ChatWindow({ room, messages, currentUserId, onSendMessage, onLoadMessages }: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState('');
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
      <div style={{ padding: '16px', borderBottom: '1px solid #ccc', backgroundColor: '#f5f5f5' }}>
        <h2 style={{ margin: 0 }}>{room.name || 'Unnamed Room'}</h2>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
          Room ID: {room.id}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center' }}>No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.userId === currentUserId;
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: isOwn ? '#2196f3' : '#e0e0e0',
                  color: isOwn ? 'white' : 'black',
                }}
              >
                {!isOwn && (
                  <div style={{ fontSize: '11px', marginBottom: '4px', opacity: 0.8 }}>
                    User: {msg.userId.slice(0, 8)}...
                  </div>
                )}
                <div>{msg.content}</div>
                <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                  {new Date(msg.sentAt).toLocaleTimeString()}
                </div>
              </div>
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
