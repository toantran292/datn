import { AlertTriangle, Archive, Trash2, LogOut } from 'lucide-react';
import { ModalCore, EModalPosition, EModalWidth, Button } from '@uts/design-system/ui';

export type ChannelActionType = 'delete' | 'archive' | 'leave';

interface ConfirmChannelActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  actionType: ChannelActionType;
  channelName: string;
  isLoading?: boolean;
}

const actionConfig: Record<ChannelActionType, {
  title: string;
  description: string;
  confirmText: string;
  icon: React.ReactNode;
  variant: 'danger' | 'primary';
}> = {
  delete: {
    title: 'Xóa kênh',
    description: 'Bạn có chắc muốn xóa kênh này? Hành động này không thể hoàn tác. Tất cả tin nhắn và tệp trong kênh này sẽ bị xóa vĩnh viễn.',
    confirmText: 'Xóa kênh',
    icon: <Trash2 size={20} className="text-red-500" />,
    variant: 'danger',
  },
  archive: {
    title: 'Lưu trữ kênh',
    description: 'Lưu trữ kênh này sẽ ẩn nó khỏi danh sách kênh. Thành viên vẫn có thể xem lịch sử tin nhắn, nhưng không thể gửi tin nhắn mới.',
    confirmText: 'Lưu trữ kênh',
    icon: <Archive size={20} className="text-amber-500" />,
    variant: 'primary',
  },
  leave: {
    title: 'Rời kênh',
    description: 'Bạn có chắc muốn rời kênh này? Bạn có thể tham gia lại sau nếu đây là kênh công khai, hoặc được mời lại nếu là kênh riêng tư.',
    confirmText: 'Rời kênh',
    icon: <LogOut size={20} className="text-custom-text-300" />,
    variant: 'danger',
  },
};

export function ConfirmChannelActionModal({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  channelName,
  isLoading = false,
}: ConfirmChannelActionModalProps) {
  const config = actionConfig[actionType];

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.SM}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            actionType === 'delete' ? 'bg-red-500/10' :
            actionType === 'archive' ? 'bg-amber-500/10' :
            'bg-custom-background-80'
          }`}>
            {config.icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-custom-text-100">{config.title}</h2>
            <p className="text-sm text-custom-text-300 mt-1">
              #{channelName}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className={`p-3 rounded-lg mb-5 ${
          actionType === 'delete' ? 'bg-red-500/10 border border-red-500/20' :
          actionType === 'archive' ? 'bg-amber-500/10 border border-amber-500/20' :
          'bg-custom-background-80 border border-custom-border-200'
        }`}>
          <div className="flex gap-2">
            <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${
              actionType === 'delete' ? 'text-red-500' :
              actionType === 'archive' ? 'text-amber-500' :
              'text-custom-text-300'
            }`} />
            <p className="text-sm text-custom-text-200">
              {config.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            variant={config.variant}
            size="sm"
            onClick={handleConfirm}
            loading={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : config.confirmText}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
