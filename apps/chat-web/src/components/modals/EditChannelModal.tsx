import { useState, useEffect } from 'react';
import { Hash, Lock, Settings } from 'lucide-react';
import { ModalCore, EModalPosition, EModalWidth, Button, Input } from '@uts/design-system/ui';
import type { Room } from '../../types';

interface EditChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Room | null;
  onUpdate: (roomId: string, data: { name?: string; description?: string; isPrivate?: boolean }) => Promise<void>;
}

export function EditChannelModal({ isOpen, onClose, channel, onUpdate }: EditChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with channel prop when modal opens
  useEffect(() => {
    if (channel && isOpen) {
      setName(channel.name || '');
      setDescription(channel.description || '');
      setIsPrivate(channel.isPrivate);
      setError(null);
    }
  }, [channel, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel) return;

    if (!name.trim()) {
      setError('Tên kênh là bắt buộc');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await onUpdate(channel.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật kênh');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPrivate(false);
    setError(null);
    onClose();
  };

  if (!isOpen || !channel) return null;

  const hasChanges =
    name.trim() !== (channel.name || '') ||
    description.trim() !== (channel.description || '') ||
    isPrivate !== channel.isPrivate;

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.MD}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-custom-primary-100/10 flex items-center justify-center">
            <Settings size={20} className="text-custom-primary-100" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-custom-text-100">Chỉnh sửa kênh</h2>
            <p className="text-sm text-custom-text-400">
              Cập nhật cài đặt kênh
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Channel Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-custom-text-200 mb-2">
              Tên kênh
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-custom-text-400">
                {isPrivate ? <Lock size={16} /> : <Hash size={16} />}
              </span>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="vd: marketing"
                className="w-full pl-10"
                disabled={isUpdating}
                autoFocus
                hasError={!!error}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-custom-text-200 mb-2">
              Mô tả <span className="text-custom-text-400 font-normal">(tùy chọn)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kênh này về gì?"
              className="w-full px-3 py-2 bg-custom-background-100 border border-custom-border-200 rounded-md text-sm text-custom-text-100 placeholder-custom-text-400 focus:outline-none focus:border-custom-primary-100 focus:ring-1 focus:ring-custom-primary-100/20 resize-none"
              rows={3}
              disabled={isUpdating}
            />
          </div>

          {/* Private Toggle */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded border-custom-border-200 text-custom-primary-100 focus:ring-custom-primary-100"
                disabled={isUpdating}
              />
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-custom-text-300" />
                <span className="text-sm font-medium text-custom-text-200">Kênh riêng tư</span>
              </div>
            </label>
            <p className="text-xs text-custom-text-400 mt-2 ml-7">
              {isPrivate
                ? 'Chỉ các thành viên được mời mới có thể truy cập kênh này'
                : 'Bất kỳ ai trong tổ chức đều có thể tìm và tham gia kênh này'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-custom-border-200">
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={handleClose}
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={isUpdating}
              disabled={!name.trim() || !hasChanges}
            >
              {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </ModalCore>
  );
}
