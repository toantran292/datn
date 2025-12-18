'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: string;
}

interface MeetingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string | null;
  roomId: string;
  userId: string | null;
  userName: string;
  onUnreadCountChange?: (count: number) => void;
}

export function MeetingChatPanel({
  isOpen,
  onClose,
  meetingId,
  userId,
  userName,
  onUnreadCountChange,
}: MeetingChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Reset unread count when panel opens
      onUnreadCountChange?.(0);
    }
  }, [isOpen, onUnreadCountChange]);

  // Load messages function
  const loadMessages = useCallback(async () => {
    if (!meetingId) return;

    try {
      const MEET_API_URL = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600';
      const response = await fetch(`${MEET_API_URL}/meet/${meetingId}/chat`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          const loadedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            userId: msg.userId,
            userName: msg.metadata?.senderName && msg.metadata.senderName !== 'User'
              ? msg.metadata.senderName
              : `User ${msg.userId?.slice(0, 6) || 'Unknown'}`,
            timestamp: msg.sentAt,
          }));
          setMessages(loadedMessages);
        }
      }
    } catch (err) {
      console.error('[MeetingChat] Failed to load messages:', err);
    }
  }, [meetingId]);

  // Load messages when panel opens and poll for updates
  useEffect(() => {
    if (!isOpen || !meetingId) return;

    // Initial load
    loadMessages();

    // Poll for new messages every 1 second
    const pollInterval = setInterval(loadMessages, 1000);

    return () => clearInterval(pollInterval);
  }, [isOpen, meetingId, loadMessages]);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !meetingId || !userId) return;

    const content = inputValue.trim();
    setInputValue('');

    // Optimistic update
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send message to chat service via meeting service API
      const MEET_API_URL = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600';
      const response = await fetch(`${MEET_API_URL}/meet/${meetingId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId,
          userName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();

      // Replace optimistic message with real one
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...msg, id: result.id || msg.id }
            : msg
        )
      );
    } catch (err) {
      console.error('[MeetingChat] Failed to send message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  }, [inputValue, meetingId, userId, userName]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-80 z-40 flex flex-col"
        style={{
          background: 'var(--ts-card-surface)',
          borderLeft: '1px solid var(--ts-border)',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--ts-border)' }}
        >
          <h3 className="font-semibold" style={{ color: 'var(--ts-text-primary)' }}>
            Chat
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--ts-text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: 'var(--ts-input-bg)' }}
              >
                <Send className="w-5 h-5" style={{ color: 'var(--ts-text-secondary)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--ts-text-secondary)' }}>
                No messages yet
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--ts-text-secondary)' }}>
                Send a message to everyone in the meeting
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.userId === userId;
              return (
                <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {/* Sender name */}
                  {!isOwn && (
                    <span
                      className="text-xs font-medium mb-1 px-1"
                      style={{ color: 'var(--ts-text-secondary)' }}
                    >
                      {msg.userName}
                    </span>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'rounded-br-md'
                        : 'rounded-bl-md'
                    }`}
                    style={{
                      backgroundColor: isOwn
                        ? 'var(--ts-teal)'
                        : 'var(--ts-input-bg)',
                      color: isOwn
                        ? 'white'
                        : 'var(--ts-text-primary)',
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span
                    className="text-[10px] mt-1 px-1"
                    style={{ color: 'var(--ts-text-secondary)' }}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="p-4 border-t"
          style={{ borderColor: 'var(--ts-border)' }}
        >
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2"
            style={{ backgroundColor: 'var(--ts-input-bg)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message to everyone..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--ts-text-primary)' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={`p-2 rounded-lg transition-all ${
                inputValue.trim()
                  ? 'bg-ts-teal text-white hover:bg-ts-teal/80'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
