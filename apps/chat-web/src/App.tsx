import { useState, useEffect, useRef } from 'react';
import { RoomsList } from './components/RoomsList';
import { ChatWindow } from './components/ChatWindow';
import { RightSidebar, type SidebarTab } from './components/RightSidebar';
import { ThreadView } from './components/ThreadView';
import { MembersTab } from './components/MembersTab';
import { FilesTab } from './components/FilesTab';
import { BrowseChannelsModal } from './components/BrowseChannelsModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { CreateDMModal } from './components/CreateDMModal';
import { api } from './services/api';
import { socketService } from './services/socket';
import { authService } from './services/auth';
import type { Room, Message } from './types';

function App() {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Right Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('thread');
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);

  // Modals
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showCreateDMModal, setShowCreateDMModal] = useState(false);

  // Use ref to access latest values in WebSocket callbacks
  const selectedRoomIdRef = useRef<string | null>(null);
  const activeThreadRef = useRef<Message | null>(null);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  // Use ref for userId to avoid stale closure
  const userIdRef = useRef<string>('');

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Auto authenticate on mount
  useEffect(() => {
    console.log('[App] useEffect: Starting authentication...');

    // Flag to prevent state updates after unmount
    let isMounted = true;

    const authenticate = async () => {
      try {
        console.log('[App] Calling authService.getMe()...');
        const me = await authService.getMe();
        console.log('[App] authService.getMe() returned:', me);

        if (!me) {
          // Not authenticated, redirect to login
          console.log('[App] User not authenticated, redirecting to login...');
          if (isMounted) {
            setIsAuthenticating(false);
          }
          authService.redirectToLogin();
          return;
        }

        // Authenticated, set user info
        console.log('[App] User authenticated:', me);

        if (!isMounted) {
          console.log('[App] Component unmounted, skipping state updates');
          return;
        }

        setUserId(me.user_id);
        setUserEmail(me.email);
        setOrgName("Organization"); // TODO: Get from me response if available

        // Set auth for API
        api.setAuth(me.user_id, me.org_id);

        console.log('[App] Connecting socket...');
        // Connect socket
        socketService.connect(me.user_id, me.org_id, {
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
            // Don't auto-add room to sidebar
            // Only creator has joined, other users need to join manually
            console.log('[App] Room created:', room);
          },
          onRoomMemberJoined: (data) => {
            // If current user joined, add room to sidebar
            // Use ref to get latest userId value
            if (data.userId === userIdRef.current) {
              const room: Room = {
                id: data.id,
                name: data.name || null,
                orgId: data.orgId,
                isPrivate: data.isPrivate,
              };
              setRooms((prev) => {
                // Check if room already exists
                if (prev.some(r => r.id === room.id)) return prev;
                return [room, ...prev];
              });
            }
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
            // Use ref to get latest values
            if (message.roomId === selectedRoomIdRef.current) {
              // Check if this is a thread reply
              if (message.threadId) {
                // Update thread messages if thread is currently open
                if (activeThreadRef.current?.id === message.threadId) {
                  setThreadMessages((prev) => [...prev, message]);
                }

                // Update reply count for parent message
                setMessages((prev) => prev.map(msg => {
                  if (msg.id === message.threadId) {
                    return {
                      ...msg,
                      replyCount: (msg.replyCount || 0) + 1
                    };
                  }
                  return msg;
                }));
              } else {
                // Main message - add to messages list
                setMessages((prev) => [...prev, message]);
              }
            }
          },
          onJoinedRoom: (data) => {
            console.log('Joined room:', data);
          },
          onUserOnline: (data) => {
            console.log('[App] User online:', data.userId);
            // Online status is fetched from API when loading members
          },
          onUserOffline: (data) => {
            console.log('[App] User offline:', data.userId);
            // Online status is fetched from API when loading members
          },
        });

        console.log('[App] Setting isLoggedIn=true, isAuthenticating=false');
        setIsLoggedIn(true);
        setIsAuthenticating(false);

        // Load rooms
        if (isMounted) {
          console.log('[App] Loading rooms...');
          await loadRooms();
          console.log('[App] Rooms loaded successfully');
        }
      } catch (error) {
        console.error('[App] Authentication failed:', error);
        console.error('[App] Error details:', error instanceof Error ? error.message : error);
        if (isMounted) {
          console.log('[App] Setting isAuthenticating=false due to error');
          setIsAuthenticating(false);
        }
        authService.redirectToLogin();
      }
    };

    authenticate();

    // Cleanup function
    return () => {
      console.log('[App] useEffect cleanup: Component unmounting');
      isMounted = false;
    };
  }, []);

  const loadRooms = async () => {
    try {
      console.log('[App] loadRooms: Calling api.listJoinedRooms...');
      // Load only JOINED rooms for sidebar
      const result = await api.listJoinedRooms(50);
      console.log('[App] loadRooms: Got', result.items.length, 'rooms');
      setRooms(result.items);
    } catch (error) {
      console.error('[App] Failed to load rooms:', error);
      console.error('[App] loadRooms error details:', error instanceof Error ? error.message : error);
    }
  };

  const handleBrowsePublicRooms = async (): Promise<Room[]> => {
    try {
      const result = await api.browsePublicRooms(100);
      return result.items;
    } catch (error) {
      console.error('Failed to browse public rooms:', error);
      return [];
    }
  };

  const handleJoinRoomFromBrowse = async (roomId: string) => {
    try {
      await api.joinRoom(roomId);
      // Reload rooms to show newly joined room
      await loadRooms();
      setShowBrowseModal(false);
      // Auto-select the room
      setSelectedRoomId(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room');
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

  const handleCreateChannel = async (name: string, isPrivate: boolean) => {
    try {
      const room = await api.createChannel(name, isPrivate);
      console.log('Channel created:', room);
      // Room will be added via WebSocket event
      // Auto-select the newly created channel
      setSelectedRoomId(room.id);
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  };

  const handleCreateDM = async (userIds: string[]) => {
    try {
      const room = await api.createDM(userIds);
      console.log('DM created:', room);
      // Room will be added via WebSocket event or already exists
      // Auto-select the DM
      setSelectedRoomId(room.id);

      // Add to rooms list if not already there
      setRooms((prev) => {
        if (prev.some(r => r.id === room.id)) return prev;
        return [room, ...prev];
      });
    } catch (error) {
      console.error('Failed to create DM:', error);
      throw error;
    }
  };

  const handleSelectRoom = async (roomId: string) => {
    setSelectedRoomId(roomId);
    setMessages([]);

    // Join room via WebSocket (for receiving messages in real-time)
    // User is already a member (rooms in sidebar are only joined rooms)
    socketService.joinRoom(roomId);
  };

  // Auto-load messages when room is selected
  useEffect(() => {
    if (!selectedRoomId) return;

    const loadMessages = async () => {
      try {
        const result = await api.listMessages(selectedRoomId, 50);
        setMessages(result.items);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [selectedRoomId]);

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

  const handleOpenThread = (message: Message) => {
    setActiveThread(message);
    setThreadMessages([]);
    setSidebarTab('thread');
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    // Don't clear activeThread immediately to avoid flicker
    setTimeout(() => {
      if (!sidebarOpen) {
        setActiveThread(null);
        setThreadMessages([]);
      }
    }, 300);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLoadThread = async (messageId: string) => {
    if (!selectedRoomId) return;
    try {
      // TODO: Implement API call to load thread messages
      // const result = await api.listThreadMessages(selectedRoomId, messageId);
      // setThreadMessages(result.items);
      console.log('Load thread messages for:', messageId);
      // Temporary: Filter messages locally
      const threadReplies = messages.filter(m => m.threadId === messageId);
      setThreadMessages(threadReplies);
    } catch (error) {
      console.error('Failed to load thread:', error);
    }
  };

  const handleSendThreadReply = (content: string) => {
    if (!selectedRoomId || !activeThread) return;
    // TODO: Implement socket/API call to send thread reply
    socketService.sendMessage(selectedRoomId, content, activeThread.id);
    console.log('Send thread reply to message:', activeThread.id);
  };

  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Show loading screen while authenticating
  if (isAuthenticating) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #1976d2',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#666', fontSize: '16px' }}>Đang xác thực...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // If not logged in after authentication check, show nothing (will redirect)
  if (!isLoggedIn) {
    return null;
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
        <div>
          <h1 style={{ margin: 0, fontSize: '20px' }}>Chat Application</h1>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>{orgName}</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px' }}>
            {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span style={{ fontSize: '14px' }}>{userEmail}</span>
          <button
            onClick={() => {
              socketService.disconnect();
              authService.redirectToLogin();
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              color: '#1976d2',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar - Rooms List */}
        <RoomsList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleSelectRoom}
          onCreateChannel={() => setShowCreateChannelModal(true)}
          onCreateDM={() => setShowCreateDMModal(true)}
          onBrowseChannels={() => setShowBrowseModal(true)}
          getDMName={(room) => room.name || 'Direct Message'}
        />

        {/* Center - Chat Window */}
        <ChatWindow
          room={selectedRoom}
          messages={messages}
          currentUserId={userId}
          onSendMessage={handleSendMessage}
          onLoadMessages={handleLoadMessages}
          onOpenThread={handleOpenThread}
          onToggleSidebar={handleToggleSidebar}
          sidebarOpen={sidebarOpen}
        />

        {/* Right Sidebar - Channel Detail with Tabs */}
        {sidebarOpen && selectedRoom && (
          <RightSidebar
            room={selectedRoom}
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            onClose={handleCloseSidebar}
            threadContent={
              activeThread ? (
                <ThreadView
                  parentMessage={activeThread}
                  threadMessages={threadMessages}
                  currentUserId={userId}
                  onSendReply={handleSendThreadReply}
                  onClose={handleCloseSidebar}
                  onLoadThread={handleLoadThread}
                />
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
                  Click "Reply" on a message to start a thread
                </div>
              )
            }
            membersContent={
              <MembersTab
                roomId={selectedRoom.id}
                onLoadMembers={async () => {
                  try {
                    const members = await api.listRoomMembers(selectedRoom.id);
                    return members.map(m => ({
                      userId: m.userId,
                      displayName: m.displayName,
                      status: m.isOnline ? 'online' as const : 'offline' as const,
                    }));
                  } catch (error) {
                    console.error('Failed to load members:', error);
                    return [];
                  }
                }}
              />
            }
            filesContent={
              <FilesTab
                roomId={selectedRoom.id}
                onLoadFiles={async () => {
                  // TODO: Implement API call to load files
                  return [];
                }}
              />
            }
          />
        )}
      </div>

      {/* Browse Channels Modal */}
      {showBrowseModal && (
        <BrowseChannelsModal
          onClose={() => setShowBrowseModal(false)}
          onJoinRoom={handleJoinRoomFromBrowse}
          onLoadPublicRooms={handleBrowsePublicRooms}
          joinedRoomIds={new Set(rooms.map(r => r.id))}
        />
      )}

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <CreateChannelModal
          onClose={() => setShowCreateChannelModal(false)}
          onCreate={handleCreateChannel}
        />
      )}

      {/* Create DM Modal */}
      {showCreateDMModal && (
        <CreateDMModal
          onClose={() => setShowCreateDMModal(false)}
          onCreate={handleCreateDM}
          currentUserId={userId}
        />
      )}
    </div>
  );
}

export default App;
