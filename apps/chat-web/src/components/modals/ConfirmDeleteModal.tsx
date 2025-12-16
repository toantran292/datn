import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { Message } from '../../types';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
  onConfirm: (messageId: string) => Promise<void>;
}

export function ConfirmDeleteModal({ isOpen, message, onClose, onConfirm }: ConfirmDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !message) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      await onConfirm(message.id);
      onClose();
    } catch (err) {
      setError('Failed to delete message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-custom-background-100 rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-custom-border-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            <h2 className="text-lg font-semibold text-custom-text-100">Delete message</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-custom-background-80 text-custom-text-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-custom-text-200">
            Are you sure you want to delete this message? This action cannot be undone.
          </p>

          {/* Message preview */}
          <div className="mt-4 p-3 bg-custom-background-90 rounded-lg border border-custom-border-200">
            <p className="text-sm text-custom-text-300 line-clamp-3">
              {message.content}
            </p>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-custom-text-200 hover:bg-custom-background-80 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
