import { useMemo, useState } from 'react';
import type { Room } from '../../types';

interface RoomsListProps {
  rooms: Room[];
  orgLevelRooms: Room[];
  projectRooms: Room[];
  currentProjectId: string | null | undefined;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateOrgChannel: () => void;
  onCreateProjectChannel: () => void;
  onCreateDM: () => void;
  onBrowseOrgChannels: () => void;
  onBrowseProjectChannels: () => void;
  getDMName: (room: Room) => string;
}

export function RoomsList({
  rooms,
  orgLevelRooms,
  projectRooms,
  currentProjectId,
  selectedRoomId,
  onSelectRoom,
  onCreateOrgChannel,
  onCreateProjectChannel,
  onCreateDM,
  onBrowseOrgChannels,
  onBrowseProjectChannels,
  getDMName,
}: RoomsListProps) {
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [dmMenuOpen, setDmMenuOpen] = useState(false);

  // Split rooms into channels and DMs
  const orgChannels = useMemo(() =>  orgLevelRooms.filter(r => r.type === 'channel'), [orgLevelRooms]);

  const projectChannels = useMemo(() => projectRooms.filter(r => r.type === 'channel'), [projectRooms]);

  const dms = useMemo(() => rooms.filter(r => r.type === 'dm'), [rooms]);

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
            <div className="flex justify-between items-center mb-2 relative">
              <div className="text-xs font-semibold text-custom-text-300 uppercase">
                Project Channels
              </div>
              <button
                onClick={() => setProjectMenuOpen(open => !open)}
                className="bg-transparent border-none text-lg cursor-pointer px-1.5 py-0.5 text-custom-text-300 hover:text-custom-text-200"
                title="Project channel actions"
              >
                ⋯
              </button>

              {projectMenuOpen && (
                <div className="absolute right-0 top-6 z-10 bg-custom-background-100 border border-custom-border-200 rounded shadow-md text-sm">
                  <button
                    onClick={() => {
                      onCreateProjectChannel();
                      setProjectMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-1.5 hover:bg-custom-background-80"
                  >
                    Create project channel
                  </button>
                  <button
                    onClick={() => {
                      onBrowseProjectChannels();
                      setProjectMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-1.5 hover:bg-custom-background-80"
                  >
                    Browse project channels
                  </button>
                </div>
              )}
            </div>

            {projectChannels.length === 0 && (
              <p className="text-custom-text-400 text-sm italic ml-3">
                No project channels yet
              </p>
            )}
            {projectChannels.map(renderRoom)}
          </div>
        )}

        {/* Organization Channels Section */}
        <div
          className={
            // When in project context, visually separate Org section as its own block
            currentProjectId
              ? 'mb-6 pt-4 mt-2 border-t border-custom-border-200'
              : 'mb-6'
          }
        >
          <div className="flex justify-between items-center mb-2 relative">
            <div className="text-xs font-semibold text-custom-text-300 uppercase">
              {currentProjectId ? 'Organization Channels' : 'Channels'}
            </div>
            <button
              onClick={() => setOrgMenuOpen(open => !open)}
              className="bg-transparent border-none text-lg cursor-pointer px-1.5 py-0.5 text-custom-text-300 hover:text-custom-text-200"
              title="Organization channel actions"
            >
              ⋯
            </button>
            {orgMenuOpen && (
              <div className="absolute right-0 top-6 z-10 bg-custom-background-100 border border-custom-border-200 rounded shadow-md text-sm">
                <button
                  onClick={() => {
                    onCreateOrgChannel();
                    setOrgMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 hover:bg-custom-background-80"
                >
                  Create channel
                </button>
                <button
                  onClick={() => {
                    onBrowseOrgChannels();
                    setOrgMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 hover:bg-custom-background-80"
                >
                  Browse channels
                </button>
              </div>
            )}
          </div>

          {orgChannels.length === 0 && (
            <p className="text-custom-text-400 text-sm italic ml-3">
              No channels yet
            </p>
          )}
          {orgChannels.map(renderRoom)}
        </div>

        {/* Direct Messages Section */}
        <div>
          <div className="flex justify-between items-center mb-2 relative">
            <div className="text-xs font-semibold text-custom-text-300 uppercase">
              Direct Messages
            </div>
            <button
              onClick={() => setDmMenuOpen(open => !open)}
              className="bg-transparent border-none text-lg cursor-pointer px-1.5 py-0.5 text-custom-text-300 hover:text-custom-text-200"
              title="DM actions"
            >
              ⋯
            </button>
          </div>
          {dmMenuOpen && (
            <div className="mb-2 ml-3 bg-custom-background-100 border border-custom-border-200 rounded shadow-sm text-sm inline-block">
              <button
                onClick={() => {
                  onCreateDM();
                  setDmMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-1.5 hover:bg-custom-background-80"
              >
                Start a conversation
              </button>
            </div>
          )}
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
