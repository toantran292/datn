import { useState } from 'react';
import { Hash, Lock } from 'lucide-react';
import { ModalCore, EModalPosition, EModalWidth, Button, Input } from '@uts/design-system/ui';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, isPrivate: boolean) => Promise<void>;
}

export function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên kênh là bắt buộc');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreate(name.trim(), isPrivate);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo kênh');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setIsPrivate(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

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
            {isPrivate ? (
              <Lock size={20} className="text-custom-primary-100" />
            ) : (
              <Hash size={20} className="text-custom-primary-100" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-custom-text-100">Tạo kênh mới</h2>
            <p className="text-sm text-custom-text-400">
              Kênh là nơi nhóm của bạn giao tiếp
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Channel Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-custom-text-200 mb-2">
              Tên kênh
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="vd: marketing"
              className="w-full"
              disabled={isCreating}
              autoFocus
              hasError={!!error}
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
                disabled={isCreating}
              />
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-custom-text-300" />
                <span className="text-sm font-medium text-custom-text-200">Đặt riêng tư</span>
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
              disabled={isCreating}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={isCreating}
              disabled={!name.trim()}
            >
              {isCreating ? 'Đang tạo...' : 'Tạo kênh'}
            </Button>
          </div>
        </form>
      </div>
    </ModalCore>
  );
}
