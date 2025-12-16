import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Message } from '../../types';

export interface EditMessageModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
  onSave: (messageId: string, content: string) => Promise<void>;
}

export function EditMessageModal({ isOpen, message, onClose, onSave }: EditMessageModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setContent(message.content);
      setError(null);
    }
  }, [message]);

  if (!isOpen || !message) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Message cannot be empty');
      return;
    }

    if (content.trim() === message.content) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(message.id, content.trim());
      onClose();
    } catch (err) {
      setError('Failed to edit message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-custom-background-100 rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-custom-border-200">
          <h2 className="text-lg font-semibold text-custom-text-100">Edit message</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-custom-background-80 text-custom-text-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-32 px-3 py-2 bg-custom-background-90 border border-custom-border-200 rounded-lg text-custom-text-100 placeholder-custom-text-400 focus:outline-none focus:border-custom-primary-100 resize-none"
            placeholder="Enter your message..."
            autoFocus
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-custom-text-200 hover:bg-custom-background-80 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-4 py-2 text-sm font-medium bg-custom-primary-100 text-white rounded-lg hover:bg-custom-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
