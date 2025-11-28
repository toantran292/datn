import type { Room } from '../types';

interface RoomsListProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateChannel: () => void;
  onCreateDM: () => void;
  onBrowseChannels: () => void;
  getDMName: (room: Room) => string;
}

export function RoomsList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onCreateChannel,
  onCreateDM,
  onBrowseChannels,
  getDMName,
}: RoomsListProps) {
  // Split rooms into channels and DMs
  const channels = rooms.filter(r => r.type === 'channel');
  const dms = rooms.filter(r => r.type === 'dm');

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
    <div style={{ width: '280px', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8f9fa' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #ddd' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Chat</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Channels Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
              Channels
            </div>
            <button
              onClick={onCreateChannel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '2px 6px',
                color: '#666',
              }}
              title="Create channel"
            >
              +
            </button>
          </div>

          {/* Browse Channels Button */}
          <button
            onClick={onBrowseChannels}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              color: '#666',
              cursor: 'pointer',
              fontSize: '13px',
              textAlign: 'left',
            }}
          >
            🔍 Browse channels
          </button>

          {channels.length === 0 && (
            <p style={{ color: '#999', fontSize: '13px', fontStyle: 'italic', marginLeft: '12px' }}>
              No channels yet
            </p>
          )}
          {channels.map(renderRoom)}
        </div>

        {/* Direct Messages Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
              Direct Messages
            </div>
            <button
              onClick={onCreateDM}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '2px 6px',
                color: '#666',
              }}
              title="Start a conversation"
            >
              +
            </button>
          </div>
          {dms.length === 0 && (
            <p style={{ color: '#999', fontSize: '13px', fontStyle: 'italic', marginLeft: '12px' }}>
              No messages yet
            </p>
          )}
          {dms.map(renderRoom)}
        </div>
      </div>
    </div>
  );
}
