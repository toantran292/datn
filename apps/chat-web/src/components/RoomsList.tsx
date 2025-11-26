import { useState } from 'react';
import type { Room } from '../types';

interface RoomsListProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, isPrivate: boolean) => void;
}

export function RoomsList({ rooms, selectedRoomId, onSelectRoom, onCreateRoom }: RoomsListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    onCreateRoom(roomName, isPrivate);
    setRoomName('');
    setIsPrivate(false);
    setShowCreateForm(false);
  };

  return (
    <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '16px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Rooms</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ New'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <input
            type="text"
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Private
          </label>
          <button type="submit" style={{ width: '100%', padding: '8px' }}>Create</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rooms.length === 0 && <p style={{ color: '#999' }}>No rooms yet</p>}
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            style={{
              padding: '12px',
              cursor: 'pointer',
              borderRadius: '4px',
              backgroundColor: selectedRoomId === room.id ? '#e3f2fd' : '#f5f5f5',
              border: selectedRoomId === room.id ? '2px solid #2196f3' : '1px solid #ddd',
            }}
          >
            <div style={{ fontWeight: 'bold' }}>
              {room.name || 'Unnamed Room'}
              {room.isPrivate && ' 🔒'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>ID: {room.id.slice(0, 8)}...</div>
          </div>
        ))}
      </div>
    </div>
  );
}
