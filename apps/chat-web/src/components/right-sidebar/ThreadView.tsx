import { useState, useEffect, useRef } from 'react';
import type { Message } from '../../types';

interface ThreadViewProps {
  parentMessage: Message;
  threadMessages: Message[];
  currentUserId: string;
  onSendReply: (content: string) => void;
  onClose: () => void;
  onLoadThread: (messageId: string) => void;
}

export function ThreadView({
  parentMessage,
  threadMessages,
  currentUserId,
  onSendReply,
  onClose,
  onLoadThread,
}: ThreadViewProps) {
  const [replyInput, setReplyInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  useEffect(() => {
    if (parentMessage) {
      onLoadThread(parentMessage.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentMessage.id]); // Only reload when parentMessage.id changes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    onSendReply(replyInput);
    setReplyInput('');
  };

  const renderMessage = (msg: Message, isParent = false) => {
    const isOwn = msg.userId === currentUserId;
    return (
      <div
        key={msg.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
          borderLeft: isParent ? '4px solid #2196f3' : 'none',
          paddingLeft: isParent ? '12px' : '0',
          backgroundColor: isParent ? '#f8f9fa' : 'transparent',
          padding: isParent ? '12px' : '0',
          marginBottom: isParent ? '16px' : '8px',
          borderRadius: isParent ? '8px' : '0',
        }}
      >
        <div
          style={{
            maxWidth: '85%',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: isOwn ? '#2196f3' : '#e0e0e0',
            color: isOwn ? 'white' : 'black',
          }}
        >
          {!isOwn && (
            <div style={{ fontSize: '11px', marginBottom: '4px', opacity: 0.8, fontWeight: 'bold' }}>
              User: {msg.userId.slice(0, 8)}...
            </div>
          )}
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
          <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
            {new Date(msg.sentAt).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'white',
      }}
    >
      {/* Thread Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f9f9f9',
        }}
      >
        <div style={{ fontSize: '13px', color: '#666' }}>
          {threadMessages.length} {threadMessages.length === 1 ? 'reply' : 'replies'} in this thread
        </div>
      </div>

      {/* Thread Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Parent Message */}
        {renderMessage(parentMessage, true)}

        {/* Replies */}
        <div style={{ marginLeft: '8px' }}>
          {threadMessages.length === 0 && (
            <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
              No replies yet. Be the first to reply!
            </p>
          )}
          {threadMessages.map((msg) => renderMessage(msg))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: '#fafafa',
        }}
      >
        <textarea
          value={replyInput}
          onChange={(e) => setReplyInput(e.target.value)}
          placeholder="Reply in thread..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: '14px',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            alignSelf: 'flex-end',
          }}
        >
          Send Reply
        </button>
      </form>
    </div>
  );
}

