"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import type { Room, Message, UnreadCount } from "../types";
import type { DetailsTab } from "../components/details";
import { api } from "../services/api";
import { socketService } from "../services/socket";
import { useAppHeaderContext } from "@uts/design-system/ui";
import type { PendingFile } from "../components/chat/FilePreview";
import { prepareUpload, uploadToPresignedUrl } from "../services/files";
import { useHuddleNotification } from "../hooks/useHuddleNotification";

// ============= Types =============
export interface ComposeUser {
  userId: string;
  displayName: string;
  email: string;
}

export interface UserInfo {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
}

interface ChatContextValue {
  // State
  rooms: Room[];
  selectedRoomId: string | null;
  selectedRoom: Room | null;
  messages: Message[];
  connectionStatus: string;
  usersCache: Map<string, UserInfo>;
  unreadCounts: Map<string, number>;
  huddleParticipantCounts: Map<string, number>;

  // Project context
  currentProjectId: string | null | undefined;
  orgLevelRooms: Room[];
  projectRooms: Room[];

  // Right Sidebar
  sidebarOpen: boolean;
  sidebarTab: DetailsTab;
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

  // Compose DM mode
  isComposingDM: boolean;
  composeUsers: ComposeUser[];
  composeDMRoom: Room | null;

  // Actions - Rooms
  loadRooms: () => Promise<void>;
  handleSelectRoom: (roomId: string) => Promise<void>;
  handleBrowsePublicRooms: () => Promise<Room[]>;
  handleJoinRoomFromBrowse: (roomId: string) => Promise<void>;
  handleCreateChannel: (name: string, isPrivate: boolean) => Promise<void>;
  handleCreateDM: (userIds: string[]) => Promise<void>;
  handleUpdateRoom: (room: Room) => void;
  handleDeleteRoom: (roomId: string) => void;
  handleArchiveRoom: (roomId: string) => void;
  handleLeaveRoom: (roomId: string) => void;

  // Actions - Messages
  handleLoadMessages: () => Promise<void>;
  handleSendMessage: (content: string, mentionedUserIds?: string[]) => void;
  handleEditMessage: (messageId: string, content: string) => Promise<void>;
  handleDeleteMessage: (messageId: string) => Promise<void>;
  handlePinMessage: (messageId: string) => Promise<void>;
  handleUnpinMessage: (messageId: string) => Promise<void>;
  handleToggleReaction: (messageId: string, emoji: string) => Promise<void>;

  // Actions - Threads
  handleOpenThread: (message: Message) => void;
  handleLoadThread: (messageId: string) => Promise<void>;
  handleSendThreadReply: (content: string, mentionedUserIds?: string[]) => void;

  // Actions - Sidebar
  handleToggleSidebar: () => void;
  handleCloseSidebar: () => void;
  setSidebarTab: (tab: DetailsTab) => void;

  // Actions - Modals
  setShowBrowseModal: (show: boolean) => void;
  setShowCreateChannelModal: (show: boolean) => void;
  setShowCreateDMModal: (show: boolean) => void;
  setBrowseScope: (scope: "org" | "project") => void;
  setCreateChannelScope: (scope: "org" | "project") => void;

  // Actions - Compose DM
  startComposingDM: () => void;
  addComposeUser: (user: ComposeUser) => void;
  removeComposeUser: (userId: string) => void;
  cancelCompose: () => void;
  handleSendComposeMessage: (content: string) => Promise<void>;

  // Actions - Unread
  getUnreadCount: (roomId: string) => number;

  // File Upload
  pendingFiles: PendingFile[];
  handleFilesSelect: (files: File[]) => void;
  handleFileRemove: (fileId: string) => void;

  // User
  currentUserId: string;
  isOrgOwner: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ============= Provider =============
export function ChatProvider({ children }: { children: ReactNode }) {
  const { auth: user, currentProjectId } = useAppHeaderContext();
  const { playHuddleSound } = useHuddleNotification();

  // ===== State =====
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [usersCache, setUsersCache] = useState<Map<string, UserInfo>>(new Map());

  // Right Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<DetailsTab>("thread");
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);

  // Modals
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showCreateDMModal, setShowCreateDMModal] = useState(false);
  const [browseScope, setBrowseScope] = useState<"org" | "project">("org");
  const [createChannelScope, setCreateChannelScope] = useState<"org" | "project">("org");

  // Compose DM mode
  const [isComposingDM, setIsComposingDM] = useState(false);
  const [composeUsers, setComposeUsers] = useState<ComposeUser[]>([]);
  const [composeDMRoom, setComposeDMRoom] = useState<Room | null>(null);

  // Unread counts
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  // Huddle participant counts (roomId -> count)
  const [huddleParticipantCounts, setHuddleParticipantCounts] = useState<Map<string, number>>(new Map());

  // Pending file uploads
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

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
            console.log('[ChatContext] onMessageNew:', message.id, 'roomId:', message.roomId, 'selectedRoomIdRef:', selectedRoomIdRef.current);
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
            } else {
              // Message in non-active room - increment unread count
              // Don't count messages from current user
              if (message.userId !== userIdRef.current) {
                setUnreadCounts((prev) => {
                  const newCounts = new Map(prev);
                  const currentCount = newCounts.get(message.roomId) || 0;
                  newCounts.set(message.roomId, currentCount + 1);
                  return newCounts;
                });
              }
            }
          },
          onMessageUpdated: (message) => {
            console.log('[ChatContext] onMessageUpdated:', message.id, 'roomId:', message.roomId, 'type:', message.type);
            if (message.roomId === selectedRoomIdRef.current) {
              // Update existing message in messages list
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === message.id ? { ...msg, ...message } : msg
                )
              );
            }
          },
          onJoinedRoom: (data) => {
            console.log("Joined room:", data);
          },
          onUserOnline: (data) => {
            console.log("[ChatContext] User online:", data.userId);
            // Update online status for DM members in real-time
            setRooms((prev) =>
              prev.map((room) => {
                if (room.type !== "dm" || !room.members) return room;
                const updatedMembers = room.members.map((member) =>
                  member.userId === data.userId ? { ...member, isOnline: true } : member
                );
                return { ...room, members: updatedMembers };
              })
            );
          },
          onUserOffline: (data) => {
            console.log("[ChatContext] User offline:", data.userId);
            // Update offline status for DM members in real-time
            setRooms((prev) =>
              prev.map((room) => {
                if (room.type !== "dm" || !room.members) return room;
                const updatedMembers = room.members.map((member) =>
                  member.userId === data.userId ? { ...member, isOnline: false } : member
                );
                return { ...room, members: updatedMembers };
              })
            );
          },
          onHuddleParticipantUpdate: (payload) => {
            console.log("[ChatContext] Huddle participant update:", payload);
            setHuddleParticipantCounts((prev) => {
              const newCounts = new Map(prev);
              if (payload.participantCount > 0) {
                newCounts.set(payload.roomId, payload.participantCount);
              } else {
                newCounts.delete(payload.roomId);
              }
              return newCounts;
            });
          },
          onHuddleStarted: (payload) => {
            console.log("[ChatContext] Huddle started:", payload);
            // Play notification sound when someone starts a huddle
            // Don't play if current user started the huddle
            if (payload.startedBy !== userIdRef.current) {
              playHuddleSound();
            }
          },
        });

        // Load rooms and unread counts
        if (isMounted) {
          console.log("[ChatContext] Loading rooms and unread counts...");
          await Promise.all([loadRooms(), loadUnreadCounts()]);
          console.log("[ChatContext] Rooms and unread counts loaded successfully");
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

  // Auto-load messages and room members when room is selected
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

    const loadMessagesAndMembers = async () => {
      try {
        // Load messages and members in parallel
        // Backend now returns reactions embedded in each message
        const [messagesResult, members] = await Promise.all([
          api.listMessages(selectedRoomId, 50),
          api.listRoomMembers(selectedRoomId),
        ]);

        // Set messages (reactions are already included from backend)
        setMessages(messagesResult.items);

        // Cache user info from room members
        setUsersCache((prev) => {
          const newCache = new Map(prev);
          members.forEach((member) => {
            newCache.set(member.userId, {
              userId: member.userId,
              displayName: member.displayName,
              avatarUrl: member.avatarUrl,
              isOnline: member.isOnline,
            });
          });
          return newCache;
        });
      } catch (error) {
        console.error("Failed to load messages or members:", error);
      }
    };

    loadMessagesAndMembers();
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

  const loadUnreadCounts = async () => {
    try {
      const counts = await api.getAllUnreadCounts();
      const countsMap = new Map<string, number>();
      counts.forEach((item) => {
        if (item.count > 0) {
          countsMap.set(item.roomId, item.count);
        }
      });
      setUnreadCounts(countsMap);
      console.log("[ChatContext] Loaded unread counts:", countsMap.size, "rooms with unread");
    } catch (error) {
      console.error("[ChatContext] Failed to load unread counts:", error);
    }
  };

  const getUnreadCount = useCallback((roomId: string): number => {
    return unreadCounts.get(roomId) || 0;
  }, [unreadCounts]);

  // ===== Actions - File Upload =====
  const handleFilesSelect = async (files: File[]) => {
    if (!selectedRoomId) return;

    // Create pending file entries
    const newPendingFiles: PendingFile[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending' as const,
      progress: 0,
    }));

    setPendingFiles((prev) => [...prev, ...newPendingFiles]);

    // Upload each file
    for (const pendingFile of newPendingFiles) {
      try {
        // Update status to uploading
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pendingFile.id ? { ...f, status: 'uploading' as const } : f))
        );

        // Get presigned URL
        const { uploadUrl, assetId, fileId } = await prepareUpload(selectedRoomId, pendingFile.file);

        // Upload to presigned URL with progress
        await uploadToPresignedUrl(uploadUrl, pendingFile.file, (progress) => {
          setPendingFiles((prev) =>
            prev.map((f) => (f.id === pendingFile.id ? { ...f, progress: progress.percent } : f))
          );
        });

        // Mark as completed and store assetId for later confirmation
        setPendingFiles((prev) =>
          prev.map((f) =>
            f.id === pendingFile.id
              ? { ...f, status: 'completed' as const, progress: 100, assetId, fileId }
              : f
          )
        );
      } catch (error) {
        console.error('File upload failed:', error);
        setPendingFiles((prev) =>
          prev.map((f) =>
            f.id === pendingFile.id
              ? { ...f, status: 'error' as const, error: 'Upload failed' }
              : f
          )
        );
      }
    }
  };

  const handleFileRemove = (fileId: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      // Revoke object URL to free memory
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
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

    // Mark room as read and clear unread count
    if (unreadCounts.has(roomId)) {
      try {
        await api.markAsRead(roomId);
        setUnreadCounts((prev) => {
          const newCounts = new Map(prev);
          newCounts.delete(roomId);
          return newCounts;
        });
      } catch (error) {
        console.error("[ChatContext] Failed to mark room as read:", error);
      }
    }
  };

  // ===== Actions - Room Management =====
  const handleUpdateRoom = (updatedRoom: Room) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === updatedRoom.id ? { ...room, ...updatedRoom } : room
      )
    );
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
    // If deleted room was selected, clear selection
    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
      setMessages([]);
    }
  };

  const handleArchiveRoom = (roomId: string) => {
    // For now, treat archive same as delete from UI perspective
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
      setMessages([]);
    }
  };

  const handleLeaveRoom = (roomId: string) => {
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
      setMessages([]);
    }
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

  const handleSendMessage = async (content: string, mentionedUserIds?: string[]) => {
    if (!selectedRoomId) return;

    // Get completed uploads to attach
    const completedUploads = pendingFiles.filter(
      (f) => f.status === 'completed' && f.assetId
    );

    // Send message with attachments if any
    if (completedUploads.length > 0) {
      const attachmentIds = completedUploads
        .map((f) => f.assetId)
        .filter((id): id is string => !!id);

      // Send message via WebSocket with attachment references
      socketService.sendMessage(selectedRoomId, content, undefined, attachmentIds, mentionedUserIds);

      // Clear pending files after send
      pendingFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setPendingFiles([]);
    } else {
      // Simple message without attachments
      socketService.sendMessage(selectedRoomId, content, undefined, undefined, mentionedUserIds);
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      const updatedMessage = await api.editMessage(messageId, content);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: updatedMessage.content, editedAt: updatedMessage.editedAt }
            : msg
        )
      );
    } catch (error) {
      console.error("Failed to edit message:", error);
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, deletedAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (error) {
      console.error("Failed to delete message:", error);
      throw error;
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      await api.pinMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isPinned: true } : msg
        )
      );
    } catch (error) {
      console.error("Failed to pin message:", error);
      throw error;
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    try {
      await api.unpinMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isPinned: false } : msg
        )
      );
    } catch (error) {
      console.error("Failed to unpin message:", error);
      throw error;
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      // Find the message to check if user already reacted
      const message = messages.find((m) => m.id === messageId);
      const existingReaction = message?.reactions?.find((r) => r.emoji === emoji);
      const hasReacted = existingReaction?.hasReacted;

      if (hasReacted) {
        // Remove reaction
        await api.removeReaction(messageId, emoji);
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            const reactions = msg.reactions || [];
            const updatedReactions = reactions
              .map((r) => {
                if (r.emoji !== emoji) return r;
                const newCount = r.count - 1;
                if (newCount <= 0) return null;
                return { ...r, count: newCount, hasReacted: false };
              })
              .filter((r): r is NonNullable<typeof r> => r !== null);
            return { ...msg, reactions: updatedReactions };
          })
        );
      } else {
        // Add reaction
        await api.addReaction(messageId, emoji);
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            const reactions = msg.reactions || [];
            const existing = reactions.find((r) => r.emoji === emoji);
            if (existing) {
              return {
                ...msg,
                reactions: reactions.map((r) =>
                  r.emoji === emoji
                    ? { ...r, count: r.count + 1, hasReacted: true }
                    : r
                ),
              };
            } else {
              return {
                ...msg,
                reactions: [
                  ...reactions,
                  { emoji, count: 1, users: [], hasReacted: true },
                ],
              };
            }
          })
        );
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
      throw error;
    }
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

  const handleSendThreadReply = (content: string, mentionedUserIds?: string[]) => {
    if (!selectedRoomId || !activeThread) return;
    socketService.sendMessage(selectedRoomId, content, activeThread.id, undefined, mentionedUserIds);
    console.log("Send thread reply to message:", activeThread.id, "mentionedUserIds:", mentionedUserIds);
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

  // ===== Actions - Compose DM =====
  const startComposingDM = () => {
    setIsComposingDM(true);
    setComposeUsers([]);
    setComposeDMRoom(null);
    setSelectedRoomId(null);
    setMessages([]);
  };

  const addComposeUser = async (user: ComposeUser) => {
    const newUsers = [...composeUsers, user];
    setComposeUsers(newUsers);

    // Check if DM already exists with these users
    const userIds = newUsers.map((u) => u.userId);
    try {
      const existingRoom = await api.findExistingDM(userIds);
      if (existingRoom) {
        setComposeDMRoom(existingRoom);
        // Load messages for the existing DM
        const result = await api.listMessages(existingRoom.id, 50);
        setMessages(result.items);
      } else {
        setComposeDMRoom(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to check existing DM:", error);
      setComposeDMRoom(null);
      setMessages([]);
    }
  };

  const removeComposeUser = async (userId: string) => {
    const newUsers = composeUsers.filter((u) => u.userId !== userId);
    setComposeUsers(newUsers);

    if (newUsers.length === 0) {
      setComposeDMRoom(null);
      setMessages([]);
      return;
    }

    // Re-check if DM exists with remaining users
    const userIds = newUsers.map((u) => u.userId);
    try {
      const existingRoom = await api.findExistingDM(userIds);
      if (existingRoom) {
        setComposeDMRoom(existingRoom);
        const result = await api.listMessages(existingRoom.id, 50);
        setMessages(result.items);
      } else {
        setComposeDMRoom(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to check existing DM:", error);
      setComposeDMRoom(null);
      setMessages([]);
    }
  };

  const cancelCompose = () => {
    setIsComposingDM(false);
    setComposeUsers([]);
    setComposeDMRoom(null);
    setMessages([]);
  };

  const handleSendComposeMessage = async (content: string) => {
    if (composeUsers.length === 0) return;

    const userIds = composeUsers.map((u) => u.userId);

    if (composeDMRoom) {
      // DM exists - send message to existing room
      socketService.sendMessage(composeDMRoom.id, content);
      // Transition to normal chat mode
      setSelectedRoomId(composeDMRoom.id);
      setIsComposingDM(false);
      setComposeUsers([]);
      setComposeDMRoom(null);
      // Add room to list if not already there
      setRooms((prev) => {
        if (prev.some((r) => r.id === composeDMRoom.id)) return prev;
        return [composeDMRoom, ...prev];
      });
    } else {
      // Create new DM and send message
      try {
        const room = await api.createDM(userIds);
        // Send message to new room
        socketService.sendMessage(room.id, content);
        // Transition to normal chat mode
        setSelectedRoomId(room.id);
        setIsComposingDM(false);
        setComposeUsers([]);
        setComposeDMRoom(null);
        // Add room to list
        setRooms((prev) => {
          if (prev.some((r) => r.id === room.id)) return prev;
          return [room, ...prev];
        });
      } catch (error) {
        console.error("Failed to create DM:", error);
      }
    }
  };

  // ===== Computed Values =====
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;
  const currentUserId = user?.user_id || "";

  // Check if current user is org owner (has OWNER role)
  const isOrgOwner = user?.roles?.some(role => role.toUpperCase() === "OWNER") || false;

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
    usersCache,
    unreadCounts,
    huddleParticipantCounts,

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

    // Compose DM mode
    isComposingDM,
    composeUsers,
    composeDMRoom,

    // Actions - Rooms
    loadRooms,
    handleSelectRoom,
    handleBrowsePublicRooms,
    handleJoinRoomFromBrowse,
    handleCreateChannel,
    handleCreateDM,
    handleUpdateRoom,
    handleDeleteRoom,
    handleArchiveRoom,
    handleLeaveRoom,

    // Actions - Messages
    handleLoadMessages,
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handlePinMessage,
    handleUnpinMessage,
    handleToggleReaction,

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

    // Actions - Compose DM
    startComposingDM,
    addComposeUser,
    removeComposeUser,
    cancelCompose,
    handleSendComposeMessage,

    // Actions - Unread
    getUnreadCount,

    // File Upload
    pendingFiles,
    handleFilesSelect,
    handleFileRemove,

    // User
    currentUserId,
    isOrgOwner,
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
