import { useState, useEffect } from 'react';
import type { Room } from '../../../types';

interface BrowseChannelsModalProps {
  onClose: () => void;
  onJoinRoom: (roomId: string) => void;
  onLoadPublicRooms: () => Promise<Room[]>;
  joinedRoomIds: Set<string>;
}

export function BrowseChannelsModal({
  onClose,
  onJoinRoom,
  onLoadPublicRooms,
  joinedRoomIds,
}: BrowseChannelsModalProps) {
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

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

  const filteredRooms = publicRooms.filter(room =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Browse Channels</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#666',
                padding: '0 8px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
            }}
            autoFocus
          />

          <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#666' }}>
            {filteredRooms.length} public {filteredRooms.length === 1 ? 'channel' : 'channels'} available
          </p>
        </div>

        {/* Channels List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
              Loading channels...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                color: '#999',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '48px' }}>🔍</div>
              <div>{searchQuery ? 'No channels found' : 'No public channels yet'}</div>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isJoined = joinedRoomIds.has(room.id);
              return (
                <div
                  key={room.id}
                  style={{
                    padding: '16px',
                    margin: '8px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: isJoined ? '#f0f7ff' : 'white',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isJoined) e.currentTarget.style.backgroundColor = '#f9f9f9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isJoined) e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '18px' }}>🌐</span>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                        {room.name || 'Unnamed Channel'}
                      </h3>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
                      Public channel • {room.id.slice(0, 8)}...
                    </p>
                  </div>

                  {isJoined ? (
                    <div
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: '#e8f5e9',
                        color: '#4caf50',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>✓</span>
                      <span>Joined</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onJoinRoom(room.id)}
                      style={{
                        padding: '8px 20px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1976d2')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2196f3')}
                    >
                      Join
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

