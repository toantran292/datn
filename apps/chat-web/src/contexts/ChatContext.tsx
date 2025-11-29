"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import type { Room, Message } from "../types";
import type { SidebarTab } from "../components/right-sidebar/RightSidebar";
import { api } from "../services/api";
import { socketService } from "../services/socket";
import { useAppHeaderContext } from "@uts/design-system/ui";

// ============= Types =============
interface ChatContextValue {
  // State
  rooms: Room[];
  selectedRoomId: string | null;
  selectedRoom: Room | null;
  messages: Message[];
  connectionStatus: string;

  // Project context
  currentProjectId: string | null | undefined;
  orgLevelRooms: Room[];
  projectRooms: Room[];

  // Right Sidebar
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  activeThread: Message | null;
  threadMessages: Message[];

  // Modals
  showBrowseModal: boolean;
  showCreateChannelModal: boolean;
  showCreateDMModal: boolean;

  // Browse scope
  browseScope: "org" | "project";

  // Create channel scope
  createChannelScope: "org" | "project";

  // Actions - Rooms
  loadRooms: () => Promise<void>;
  handleSelectRoom: (roomId: string) => Promise<void>;
  handleBrowsePublicRooms: () => Promise<Room[]>;
  handleJoinRoomFromBrowse: (roomId: string) => Promise<void>;
  handleCreateChannel: (name: string, isPrivate: boolean) => Promise<void>;
  handleCreateDM: (userIds: string[]) => Promise<void>;

  // Actions - Messages
  handleLoadMessages: () => Promise<void>;
  handleSendMessage: (content: string) => void;

  // Actions - Threads
  handleOpenThread: (message: Message) => void;
  handleLoadThread: (messageId: string) => Promise<void>;
  handleSendThreadReply: (content: string) => void;

  // Actions - Sidebar
  handleToggleSidebar: () => void;
  handleCloseSidebar: () => void;
  setSidebarTab: (tab: SidebarTab) => void;

  // Actions - Modals
  setShowBrowseModal: (show: boolean) => void;
  setShowCreateChannelModal: (show: boolean) => void;
  setShowCreateDMModal: (show: boolean) => void;
  setBrowseScope: (scope: "org" | "project") => void;
  setCreateChannelScope: (scope: "org" | "project") => void;

  // User
  currentUserId: string;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ============= Provider =============
export function ChatProvider({ children }: { children: ReactNode }) {
  const { auth: user, currentProjectId } = useAppHeaderContext();

  // ===== State =====
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Right Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("thread");
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);

  // Modals
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showCreateDMModal, setShowCreateDMModal] = useState(false);
  const [browseScope, setBrowseScope] = useState<"org" | "project">("org");
  const [createChannelScope, setCreateChannelScope] = useState<"org" | "project">("org");

  // Refs to access latest values in WebSocket callbacks
  const selectedRoomIdRef = useRef<string | null>(null);
  const activeThreadRef = useRef<Message | null>(null);
  const userIdRef = useRef<string>("");

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  useEffect(() => {
    if (user?.user_id) {
      userIdRef.current = user.user_id;
    }
  }, [user]);

  // ===== Initialization =====
  useEffect(() => {
    if (!user) return;

    console.log("[ChatContext] User authenticated:", user);

    let isMounted = true;

    const initialize = async () => {
      try {
        // Set auth for API
        if (user.org_id) {
          api.setAuth(user.user_id, user.org_id);
        }

        console.log("[ChatContext] Connecting socket...");
        // Connect socket
        socketService.connect(user.user_id, user.org_id || "", {
          onConnect: () => {
            setConnectionStatus("connected");
            console.log("Socket connected");
          },
          onDisconnect: () => {
            setConnectionStatus("disconnected");
          },
          onRoomsBootstrap: (bootstrapRooms) => {
            const roomsWithType = bootstrapRooms.map((room) => ({
              ...room,
              type: room.type || "channel",
            }));
            console.log("[ChatContext] Rooms bootstrap:", roomsWithType.length, "rooms");
            setRooms(roomsWithType);
          },
          onRoomCreated: (room) => {
            console.log("[ChatContext] Room created:", room);
          },
          onRoomMemberJoined: (data) => {
            if (data.userId === userIdRef.current) {
              const room: Room = {
                id: data.id,
                name: data.name || null,
                orgId: data.orgId,
                isPrivate: data.isPrivate,
                type: "channel",
              };
              setRooms((prev) => {
                if (prev.some((r) => r.id === room.id)) return prev;
                return [room, ...prev];
              });
            }
          },
          onRoomUpdated: (payload) => {
            setRooms((prev) => {
              const updated = prev.filter((r) => r.id !== payload.roomId);
              const room = prev.find((r) => r.id === payload.roomId);
              if (room) return [room, ...updated];
              return prev;
            });
          },
          onMessageNew: (message) => {
            if (message.roomId === selectedRoomIdRef.current) {
              if (message.threadId) {
                // Update thread messages if thread is currently open
                if (activeThreadRef.current?.id === message.threadId) {
                  setThreadMessages((prev) => [...prev, message]);
                }

                // Update reply count for parent message
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id === message.threadId) {
                      return {
                        ...msg,
                        replyCount: (msg.replyCount || 0) + 1,
                      };
                    }
                    return msg;
                  })
                );
              } else {
                // Main message - add to messages list
                setMessages((prev) => [...prev, message]);
              }
            }
          },
          onJoinedRoom: (data) => {
            console.log("Joined room:", data);
          },
          onUserOnline: (data) => {
            console.log("[ChatContext] User online:", data.userId);
          },
          onUserOffline: (data) => {
            console.log("[ChatContext] User offline:", data.userId);
          },
        });

        // Load rooms
        if (isMounted) {
          console.log("[ChatContext] Loading rooms...");
          await loadRooms();
          console.log("[ChatContext] Rooms loaded successfully");
        }
      } catch (error) {
        console.error("[ChatContext] Initialization failed:", error);
      }
    };

    initialize();

    return () => {
      console.log("[ChatContext] Component unmounting");
      isMounted = false;
    };
  }, [user]);

  // Auto-load messages when room is selected
  useEffect(() => {
    if (!selectedRoomId) {
      // When no room is selected, also clear thread state
      setActiveThread(null);
      setThreadMessages([]);
      return;
    }

    // Whenever room changes, reset thread state so sidebar shows empty thread
    setActiveThread(null);
    setThreadMessages([]);

    const loadMessages = async () => {
      try {
        const result = await api.listMessages(selectedRoomId, 50);
        setMessages(result.items);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };

    loadMessages();
  }, [selectedRoomId]);

  // Cleanup
  useEffect(() => () => socketService.disconnect(), []);

  // Reload rooms when project changes
  useEffect(() => {
    if (user) {
      console.log("[ChatContext] Project changed, reloading rooms. ProjectId:", currentProjectId);
      loadRooms();
    }
  }, [currentProjectId, user]);

  // ===== Actions - Rooms =====
  const loadRooms = async () => {
    try {
      console.log("[ChatContext] loadRooms: Loading rooms for projectId:", currentProjectId);

      let allRooms: Room[] = [];

      if (currentProjectId) {
        // In project context: Load org channels + project channels + DMs
        console.log("[ChatContext] Loading rooms for project:", currentProjectId);
        const [orgChannels, projectChannels, dms] = await Promise.all([
          api.listOrgChannels(50),
          api.listProjectChannels(currentProjectId, 50),
          api.listDms(50),
        ]);

        allRooms = [...orgChannels.items, ...projectChannels.items, ...dms.items];
        console.log(
          "[ChatContext] Loaded:",
          orgChannels.items.length,
          "org channels,",
          projectChannels.items.length,
          "project channels,",
          dms.items.length,
          "DMs"
        );
      } else {
        // In org context: Load org channels + DMs only
        console.log("[ChatContext] Loading rooms for org (no project)");
        const [orgChannels, dms] = await Promise.all([api.listOrgChannels(50), api.listDms(50)]);

        allRooms = [...orgChannels.items, ...dms.items];
        console.log("[ChatContext] Loaded:", orgChannels.items.length, "org channels,", dms.items.length, "DMs");
      }

      const roomsWithType = allRooms.map((room) => ({
        ...room,
        type: room.type || "channel",
      }));
      setRooms(roomsWithType);
    } catch (error) {
      console.error("[ChatContext] Failed to load rooms:", error);
    }
  };

  const handleBrowsePublicRooms = async (): Promise<Room[]> => {
    try {
      // Browse public rooms based on current browse scope
      if (browseScope === "project" && currentProjectId) {
        const result = await api.browseProjectPublicRooms(currentProjectId, 100);
        return result.items;
      }

      // Default: browse org-level public channels
      const result = await api.browseOrgPublicRooms(100);
      return result.items;
    } catch (error) {
      console.error("Failed to browse public rooms:", error);
      return [];
    }
  };

  const handleJoinRoomFromBrowse = async (roomId: string) => {
    try {
      await api.joinRoom(roomId);
      await loadRooms();
      setShowBrowseModal(false);
      setSelectedRoomId(roomId);
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Failed to join room");
    }
  };

  const handleCreateChannel = async (name: string, isPrivate: boolean) => {
    try {
      // Decide whether to create org-level or project-level channel based on scope
      const projectIdForChannel = createChannelScope === "project" ? currentProjectId : null;

      console.log("[ChatContext] Creating channel with projectId:", projectIdForChannel, "scope:", createChannelScope);

      const room = await api.createChannel(name, isPrivate, projectIdForChannel);
      console.log("[ChatContext] Channel created response:", room);

      // Verify backend returned expected projectId (if any)
      if (projectIdForChannel && room.projectId !== projectIdForChannel) {
        console.warn("[ChatContext] Backend returned different projectId!", {
          expected: projectIdForChannel,
          received: room.projectId,
        });
      }

      const newRoom: Room = {
        id: room.id,
        name: room.name || null,
        orgId: room.orgId,
        isPrivate: room.isPrivate,
        type: "channel",
        projectId: room.projectId, // Backend should return this
      };

      console.log("[ChatContext] Adding new room to list:", newRoom);

      setRooms((prev) => {
        if (prev.some((r) => r.id === newRoom.id)) return prev;
        return [newRoom, ...prev];
      });

      setSelectedRoomId(room.id);
      socketService.joinRoom(room.id);
    } catch (error) {
      console.error("Failed to create channel:", error);
      throw error;
    }
  };

  const handleCreateDM = async (userIds: string[]) => {
    try {
      const room = await api.createDM(userIds);
      console.log("DM created:", room);
      setSelectedRoomId(room.id);

      setRooms((prev) => {
        if (prev.some((r) => r.id === room.id)) return prev;
        return [room, ...prev];
      });
    } catch (error) {
      console.error("Failed to create DM:", error);
      throw error;
    }
  };

  const handleSelectRoom = async (roomId: string) => {
    // If user selects the same room again, do nothing to avoid clearing messages
    setSelectedRoomId((prev) => {
      if (prev === roomId) {
        return prev;
      }

      // Switch to a different room: clear messages and join new room
      setMessages([]);
      socketService.joinRoom(roomId);
      return roomId;
    });
  };

  // ===== Actions - Messages =====
  const handleLoadMessages = async () => {
    if (!selectedRoomId) return;
    try {
      const result = await api.listMessages(selectedRoomId, 50);
      setMessages(result.items);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!selectedRoomId) return;
    socketService.sendMessage(selectedRoomId, content);
  };

  // ===== Actions - Threads =====
  const handleOpenThread = (message: Message) => {
    // If the same thread is already open in the sidebar, do nothing
    if (activeThread?.id === message.id && sidebarOpen && sidebarTab === "thread") {
      return;
    }

    setActiveThread(message);
    setThreadMessages([]);
    setSidebarTab("thread");
    setSidebarOpen(true);
  };

  const handleLoadThread = async (messageId: string) => {
    if (!selectedRoomId) return;
    try {
      console.log("Load thread messages for:", messageId, "in room:", selectedRoomId);
      // Load thread replies from backend so we always get full history,
      // not only messages received while the thread sidebar was open.
      const result = await api.listThreadMessages(selectedRoomId, messageId, 50);
      setThreadMessages(result.items);
    } catch (error) {
      console.error("Failed to load thread:", error);
    }
  };

  const handleSendThreadReply = (content: string) => {
    if (!selectedRoomId || !activeThread) return;
    socketService.sendMessage(selectedRoomId, content, activeThread.id);
    console.log("Send thread reply to message:", activeThread.id);
  };

  // ===== Actions - Sidebar =====
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
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

  // ===== Computed Values =====
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;
  const currentUserId = user?.user_id || "";

  // Separate rooms by type for UI rendering
  // Backend returns different room types via separate API calls
  const orgLevelRooms = rooms.filter((r) => (r.type === "channel" && !r.projectId) || r.type === "dm");
  const projectRooms = rooms.filter((r) => r.type === "channel" && !!r.projectId);

  const value: ChatContextValue = {
    // State
    rooms,
    selectedRoomId,
    selectedRoom,
    messages,
    connectionStatus,

    // Project context
    currentProjectId,
    orgLevelRooms,
    projectRooms,

    // Right Sidebar
    sidebarOpen,
    sidebarTab,
    activeThread,
    threadMessages,

    // Modals
    showBrowseModal,
    showCreateChannelModal,
    showCreateDMModal,

    // Browse scope
    browseScope,
    // Create channel scope
    createChannelScope,

    // Actions - Rooms
    loadRooms,
    handleSelectRoom,
    handleBrowsePublicRooms,
    handleJoinRoomFromBrowse,
    handleCreateChannel,
    handleCreateDM,

    // Actions - Messages
    handleLoadMessages,
    handleSendMessage,

    // Actions - Threads
    handleOpenThread,
    handleLoadThread,
    handleSendThreadReply,

    // Actions - Sidebar
    handleToggleSidebar,
    handleCloseSidebar,
    setSidebarTab,

    // Actions - Modals
    setShowBrowseModal,
    setShowCreateChannelModal,
    setShowCreateDMModal,

    setBrowseScope,
    setCreateChannelScope,

    // User
    currentUserId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ============= Hook =============
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}
