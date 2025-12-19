import { useState, useEffect } from 'react';
import { Hash, Search, X, Check } from 'lucide-react';
import { ModalCore, EModalPosition, EModalWidth, Button, Input } from '@uts/design-system/ui';
import type { Room } from '../../types';

interface BrowseChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomId: string) => void;
  onLoadPublicRooms: () => Promise<Room[]>;
  joinedRoomIds: Set<string>;
}

export function BrowseChannelsModal({
  isOpen,
  onClose,
  onJoinRoom,
  onLoadPublicRooms,
  joinedRoomIds,
}: BrowseChannelsModalProps) {
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRooms();
    }
  }, [isOpen]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const rooms = await onLoadPublicRooms();
      setPublicRooms(rooms);
    } catch (error) {
      console.error('Failed to load public rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const filteredRooms = publicRooms.filter(room =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.XXL}
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b border-custom-border-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-custom-primary-100/10 flex items-center justify-center">
                <Hash size={20} className="text-custom-primary-100" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-custom-text-100">Duyệt kênh</h2>
                <p className="text-sm text-custom-text-400">
                  Tìm và tham gia các kênh công khai
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-custom-text-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm kênh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
              autoFocus
            />
          </div>

          <p className="mt-3 text-sm text-custom-text-400">
            {filteredRooms.length} kênh công khai có sẵn
          </p>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 vertical-scrollbar scrollbar-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 mb-3 border-2 border-custom-primary-100/20 border-t-custom-primary-100 rounded-full animate-spin" />
              <p className="text-sm text-custom-text-400">Đang tải kênh...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 mb-3 rounded-xl bg-custom-background-80 flex items-center justify-center">
                <Search size={24} className="text-custom-text-300" />
              </div>
              <p className="text-sm font-medium text-custom-text-200 mb-1">
                {searchQuery ? 'Không tìm thấy kênh' : 'Chưa có kênh công khai'}
              </p>
              <p className="text-xs text-custom-text-400">
                {searchQuery
                  ? 'Thử điều chỉnh từ khóa tìm kiếm'
                  : 'Các kênh công khai sẽ xuất hiện ở đây'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRooms.map((room) => {
                const isJoined = joinedRoomIds.has(room.id);
                return (
                  <div
                    key={room.id}
                    className={`
                      flex items-center justify-between p-4 rounded-lg border transition-colors
                      ${isJoined
                        ? 'bg-custom-primary-100/5 border-custom-primary-100/20'
                        : 'border-custom-border-200 hover:bg-custom-background-80'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-custom-background-80 flex items-center justify-center flex-shrink-0">
                        <Hash size={18} className="text-custom-text-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-custom-text-100 truncate">
                          {room.name || 'Kênh chưa đặt tên'}
                        </h3>
                        <p className="text-xs text-custom-text-400 truncate">
                          Kênh công khai
                        </p>
                      </div>
                    </div>

                    {isJoined ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/10 text-green-600 text-sm font-medium">
                        <Check size={14} />
                        <span>Đã tham gia</span>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onJoinRoom(room.id)}
                      >
                        Tham gia
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ModalCore>
  );
}
