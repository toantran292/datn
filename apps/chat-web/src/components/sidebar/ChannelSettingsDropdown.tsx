import { useState } from 'react';
import { MoreVertical, Settings, Archive, Trash2, LogOut } from 'lucide-react';
import { Popover } from '@uts/design-system/ui';
import type { Room } from '../../types';
import { EditChannelModal } from '../modals/EditChannelModal';
import { ConfirmChannelActionModal, ChannelActionType } from '../modals/ConfirmChannelActionModal';
import { api } from '../../services/api';

interface ChannelSettingsDropdownProps {
  room: Room;
  isOwner?: boolean;
  onRoomUpdated?: (room: Room) => void;
  onRoomDeleted?: (roomId: string) => void;
  onRoomArchived?: (roomId: string) => void;
  onLeftRoom?: (roomId: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function ChannelSettingsDropdown({
  room,
  isOwner = false,
  onRoomUpdated,
  onRoomDeleted,
  onRoomArchived,
  onLeftRoom,
}: ChannelSettingsDropdownProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ChannelActionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (roomId: string, data: { name?: string; description?: string; isPrivate?: boolean }) => {
    const updatedRoom = await api.updateChannel(roomId, data);
    onRoomUpdated?.(updatedRoom);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setIsLoading(true);
    try {
      switch (confirmAction) {
        case 'delete':
          await api.deleteChannel(room.id);
          onRoomDeleted?.(room.id);
          break;
        case 'archive':
          await api.archiveChannel(room.id);
          onRoomArchived?.(room.id);
          break;
        case 'leave':
          await api.leaveChannel(room.id);
          onLeftRoom?.(room.id);
          break;
      }
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'edit',
      label: 'Chỉnh sửa kênh',
      icon: <Settings size={16} />,
      onClick: () => setShowEditModal(true),
      disabled: !isOwner,
    },
    {
      id: 'archive',
      label: 'Lưu trữ kênh',
      icon: <Archive size={16} />,
      onClick: () => setConfirmAction('archive'),
      disabled: !isOwner,
    },
    {
      id: 'leave',
      label: 'Rời kênh',
      icon: <LogOut size={16} />,
      onClick: () => setConfirmAction('leave'),
    },
    {
      id: 'delete',
      label: 'Xóa kênh',
      icon: <Trash2 size={16} />,
      onClick: () => setConfirmAction('delete'),
      danger: true,
      disabled: !isOwner,
    },
  ].filter(item => !item.disabled);

  return (
    <>
      <Popover
        popperPosition="bottom-end"
        buttonClassName="p-1 rounded hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100 transition-colors opacity-0 group-hover:opacity-100"
        button={<MoreVertical size={16} />}
        panelClassName="my-1 w-48 rounded-lg border border-custom-border-200 bg-custom-background-100 py-1 shadow-lg z-50"
      >
        <div className="py-1">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                ${item.danger
                  ? 'text-red-500 hover:bg-red-500/10'
                  : 'text-custom-text-200 hover:bg-custom-background-80 hover:text-custom-text-100'
                }
                ${index === menuItems.length - 1 && item.danger ? 'border-t border-custom-border-200 mt-1 pt-2' : ''}
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </Popover>

      {/* Edit Modal */}
      <EditChannelModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        channel={room}
        onUpdate={handleUpdate}
      />

      {/* Confirm Action Modal */}
      {confirmAction && (
        <ConfirmChannelActionModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          actionType={confirmAction}
          channelName={room.name || 'Kênh chưa đặt tên'}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
