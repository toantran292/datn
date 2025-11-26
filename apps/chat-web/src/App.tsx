import { useState, useEffect } from 'react';
import { RoomsList } from './components/RoomsList';
import { ChatWindow } from './components/ChatWindow';
import { api } from './services/api';
import { socketService } from './services/socket';
import type { Room, Message } from './types';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [orgId, setOrgId] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !orgId.trim()) {
      alert('Please enter both User ID and Org ID');
      return;
    }

    // Set auth for API
    api.setAuth(userId, orgId);

    // Connect socket
    socketService.connect(userId, orgId, {
      onConnect: () => {
        setConnectionStatus('connected');
        console.log('Socket connected');
      },
      onDisconnect: () => {
        setConnectionStatus('disconnected');
      },
      onRoomsBootstrap: (bootstrapRooms) => {
        setRooms(bootstrapRooms);
      },
      onRoomCreated: (room) => {
        setRooms((prev) => [room, ...prev]);
      },
      onRoomUpdated: (payload) => {
        // Update room order (move to top)
        setRooms((prev) => {
          const updated = prev.filter(r => r.id !== payload.roomId);
          const room = prev.find(r => r.id === payload.roomId);
          if (room) return [room, ...updated];
          return prev;
        });
      },
      onMessageNew: (message) => {
        if (message.roomId === selectedRoomId) {
          setMessages((prev) => [...prev, message]);
        }
      },
      onJoinedRoom: (data) => {
        console.log('Joined room:', data);
      },
    });

    setIsLoggedIn(true);

    // Load rooms
    loadRooms();
  };

  const loadRooms = async () => {
    try {
      const result = await api.listRooms(50);
      setRooms(result.items);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const handleCreateRoom = async (name: string, isPrivate: boolean) => {
    try {
      const room = await api.createRoom(name, isPrivate);
      console.log('Room created:', room);
      // Room will be added via WebSocket event
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room');
    }
  };

  const handleSelectRoom = async (roomId: string) => {
    setSelectedRoomId(roomId);
    setMessages([]);

    // Join room via WebSocket
    socketService.joinRoom(roomId);

    // Join via API (for membership)
    try {
      await api.joinRoom(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const handleLoadMessages = async () => {
    if (!selectedRoomId) return;
    try {
      const result = await api.listMessages(selectedRoomId, 50);
      setMessages(result.items);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!selectedRoomId) return;
    socketService.sendMessage(selectedRoomId, content);
  };

  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  if (!isLoggedIn) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <form onSubmit={handleLogin} style={{
          padding: '32px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minWidth: '400px'
        }}>
          <h1 style={{ marginTop: 0 }}>Chat Login</h1>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              User ID (UUID):
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
              style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Org ID (UUID):
            </label>
            <input
              type="text"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174001"
              style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
          <p style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
            Note: Enter valid UUIDs for User ID and Org ID from your system
          </p>
        </form>
      </div>
    );
  }

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#1976d2',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Chat Application</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>
            Status: {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span style={{ fontSize: '12px' }}>User: {userId.slice(0, 8)}...</span>
          <button
            onClick={() => {
              socketService.disconnect();
              setIsLoggedIn(false);
              setRooms([]);
              setMessages([]);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              color: '#1976d2',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <RoomsList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={handleCreateRoom}
        />
        <ChatWindow
          room={selectedRoom}
          messages={messages}
          currentUserId={userId}
          onSendMessage={handleSendMessage}
          onLoadMessages={handleLoadMessages}
        />
      </div>
    </div>
  );
}

export default App;
