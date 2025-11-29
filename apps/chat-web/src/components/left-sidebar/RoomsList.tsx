import { useMemo } from 'react';
import type { Room } from '../../types';

interface RoomsListProps {
  rooms: Room[];
  orgLevelRooms: Room[];
  projectRooms: Room[];
  currentProjectId: string | null | undefined;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateChannel: () => void;
  onCreateDM: () => void;
  onBrowseChannels: () => void;
  getDMName: (room: Room) => string;
}

export function RoomsList({
  rooms,
  orgLevelRooms,
  projectRooms,
  currentProjectId,
  selectedRoomId,
  onSelectRoom,
  onCreateChannel,
  onCreateDM,
  onBrowseChannels,
  getDMName,
}: RoomsListProps) {
  // Split rooms into channels and DMs
  const orgChannels = useMemo(() => {
    return orgLevelRooms.filter(r => r.type === 'channel');
  }, [orgLevelRooms]);

  const projectChannels = useMemo(() => {
    return projectRooms.filter(r => r.type === 'channel');
  }, [projectRooms]);

  const dms = useMemo(() => {
    return rooms.filter(r => r.type === 'dm');
  }, [rooms]);

  const renderRoom = (room: Room) => {
    const displayName = room.type === 'dm' ? getDMName(room) : (room.name || 'Unnamed Channel');
    const icon = room.type === 'dm' ? '💬' : (room.isPrivate ? '🔒' : '#');

    return (
      <div
        key={room.id}
        onClick={() => onSelectRoom(room.id)}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          borderRadius: '4px',
          backgroundColor: selectedRoomId === room.id ? '#e3f2fd' : 'transparent',
          fontWeight: selectedRoomId === room.id ? '600' : '400',
        }}
      >
        <span style={{ marginRight: '8px' }}>{icon}</span>
        {displayName}
      </div>
    );
  };

  return (
    <div className="w-[280px] border-r border-custom-border-200 flex flex-col h-full bg-custom-background-100">
      <div className="p-4 border-b border-custom-border-200">
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Project Channels Section - Only show when in project context */}
        {currentProjectId && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-semibold text-custom-text-300 uppercase">
                Project Channels
              </div>
              <button
                onClick={onCreateChannel}
                className="bg-transparent border-none text-lg cursor-pointer px-1.5 py-0.5 text-custom-text-300 hover:text-custom-text-200"
                title="Create project channel"
              >
                +
              </button>
            </div>

            {/* Browse Channels Button */}
            <button
              onClick={onBrowseChannels}
              className="w-full p-2 mb-2 bg-transparent border border-custom-border-200 rounded text-custom-text-300 cursor-pointer text-sm text-left hover:bg-custom-background-80"
            >
              🔍 Browse project channels
            </button>

            {projectChannels.length === 0 && (
              <p className="text-custom-text-400 text-sm italic ml-3">
                No project channels yet
              </p>
            )}
            {projectChannels.map(renderRoom)}
          </div>
        )}

        {/* Organization Channels Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs font-semibold text-custom-text-300 uppercase">
              {currentProjectId ? 'Organization Channels' : 'Channels'}
            </div>
            {!currentProjectId && (
              <button
                onClick={onCreateChannel}
                className="bg-transparent border-none text-lg cursor-pointer px-1.5 py-0.5 text-custom-text-300 hover:text-custom-text-200"
                title="Create channel"
              >
                +
              </button>
            )}
          </div>

          {!currentProjectId && (
            <button
              onClick={onBrowseChannels}
              className="w-full p-2 mb-2 bg-transparent border border-custom-border-200 rounded text-custom-text-300 cursor-pointer text-sm text-left hover:bg-custom-background-80"
            >
              🔍 Browse channels
            </button>
          )}

          {orgChannels.length === 0 && (
            <p className="text-custom-text-400 text-sm italic ml-3">
              No channels yet
            </p>
          )}
          {orgChannels.map(renderRoom)}
        </div>

        {/* Direct Messages Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs font-semibold text-custom-text-300 uppercase">
              Direct Messages
            </div>
            <button
              onClick={onCreateDM}
              className="bg-transparent border-none text-lg cursor-pointer px-1.5 py-0.5 text-custom-text-300 hover:text-custom-text-200"
              title="Start a conversation"
            >
              +
            </button>
          </div>
          {dms.length === 0 && (
            <p className="text-custom-text-400 text-sm italic ml-3">
              No messages yet
            </p>
          )}
          {dms.map(renderRoom)}
        </div>
      </div>
    </div>
  );
}
