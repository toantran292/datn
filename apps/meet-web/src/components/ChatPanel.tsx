import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Smile, Paperclip } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

interface ChatPanelProps {
  onClose: () => void;
}

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'Sarah Chen',
    text: "Let's share the deck after this.",
    timestamp: '12:15 PM',
    isOwn: false,
  },
  {
    id: '2',
    sender: 'You',
    text: "Sure, I'll upload it.",
    timestamp: '12:16 PM',
    isOwn: true,
  },
  {
    id: '3',
    sender: 'Marcus Johnson',
    text: 'Can someone share the Q3 metrics spreadsheet?',
    timestamp: '12:18 PM',
    isOwn: false,
  },
  {
    id: '4',
    sender: 'Maya Patel',
    text: 'I have it ready. Sending link now.',
    timestamp: '12:19 PM',
    isOwn: false,
  },
];

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: String(Date.now()),
        sender: 'You',
        text: inputValue.trim(),
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        isOwn: true,
      };
      setMessages([...messages, newMessage]);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-full flex flex-col border-l"
      style={{
        width: '360px',
        background: 'var(--ts-card-surface)',
        borderColor: 'var(--ts-border)',
        boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{
          borderColor: 'var(--ts-border)',
        }}
      >
        <h3
          className="text-[var(--ts-text-primary)] tracking-tight"
          style={{ fontSize: '16px', fontWeight: 600 }}
        >
          Chat
        </h3>
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 196, 171, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors"
          style={{
            color: 'var(--ts-text-secondary)',
          }}
        >
          <X className="w-5 h-5" style={{ color: 'var(--ts-teal)' }} />
        </motion.button>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 196, 171, 0.3) transparent',
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col ${message.isOwn ? 'items-end' : 'items-start'}`}
            >
              {!message.isOwn && (
                <span
                  className="text-[var(--ts-text-primary)] mb-1 px-1"
                  style={{ fontSize: '13px', fontWeight: 600 }}
                >
                  {message.sender}
                </span>
              )}
              <div
                className="rounded-xl px-4 py-2.5 max-w-[85%]"
                style={{
                  background: message.isOwn
                    ? 'rgba(255, 136, 0, 0.08)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: message.isOwn
                    ? '1px solid rgba(255, 136, 0, 0.15)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <p
                  className="text-[var(--ts-text-primary)]"
                  style={{ fontSize: '14px', lineHeight: '1.5' }}
                >
                  {message.text}
                </p>
                <span
                  className="text-[#64748B] mt-1 block"
                  style={{ fontSize: '11px' }}
                >
                  {message.timestamp}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="border-t px-4 py-4"
        style={{
          borderColor: 'var(--ts-border)',
          background: 'rgba(30, 41, 59, 0.5)',
        }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2 transition-all"
          style={{
            background: '#1E293B',
            border: isFocused
              ? '1px solid var(--ts-teal)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: isFocused ? '0 0 0 2px rgba(0, 196, 171, 0.1)' : 'none',
          }}
        >
          {/* Emoji button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-1 rounded-lg transition-colors mb-1"
            style={{
              color: 'var(--ts-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--ts-teal)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--ts-text-secondary)';
            }}
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          {/* Text input */}
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Send a message to everyone…"
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[var(--ts-text-primary)] placeholder:text-[var(--ts-text-secondary)]"
            style={{
              fontSize: '14px',
              maxHeight: '100px',
              minHeight: '24px',
            }}
          />

          {/* Attach button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-1 rounded-lg transition-colors mb-1"
            style={{
              color: 'var(--ts-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--ts-teal)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--ts-text-secondary)';
            }}
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>

          {/* Send button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-2 rounded-lg transition-all mb-1"
            style={{
              background:
                inputValue.trim() && isFocused
                  ? 'linear-gradient(135deg, var(--ts-orange) 0%, var(--ts-teal) 100%)'
                  : inputValue.trim()
                  ? 'var(--ts-teal)'
                  : 'rgba(148, 163, 184, 0.2)',
              color: inputValue.trim() ? 'white' : 'var(--ts-text-secondary)',
              boxShadow: inputValue.trim() ? '0 2px 8px rgba(0, 196, 171, 0.3)' : 'none',
            }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
