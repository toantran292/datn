"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bell, X, Check, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications, type Notification } from "@uts/notifications";
import { cn } from "../utils";
import { useAppHeaderContext } from "./hooks/app-header-provider";

interface NotificationBellProps {
  className?: string;
}

interface StoredNotification {
  id: string;
  userId: string;
  orgId: string | null;
  type: string;
  category: string;
  title: string;
  content: string | null;
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return targetDate.toLocaleDateString();
}

// Convert stored notification to Notification format
function toNotification(stored: StoredNotification): Notification {
  return {
    id: stored.id,
    userId: stored.userId,
    title: stored.title,
    message: stored.content || "",
    metadata: stored.metadata,
    actionUrl: stored.metadata?.actionUrl,
    timestamp: stored.createdAt,
    read: stored.isRead,
  };
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const { apiBaseUrl, auth } = useAppHeaderContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storedNotifications, setStoredNotifications] = useState<Notification[]>([]);
  const [storedUnreadCount, setStoredUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);

  const userId = auth?.user_id;

  // WebSocket for real-time notifications
  const {
    notifications: realtimeNotifications,
    unreadCount: realtimeUnreadCount,
    markAsRead: markAsReadLocal,
    clearAll: clearAllLocal,
    remove: removeLocal,
    isConnected,
    isConnecting,
  } = useNotifications({
    gatewayUrl: apiBaseUrl,
    userId: userId || "",
    maxNotifications: 20,
    autoConnect: !!userId,
    debug: process.env.NODE_ENV === "development",
  });

  // Merge real-time and stored notifications (dedupe by id)
  const allNotifications = React.useMemo(() => {
    const seen = new Set<string>();
    const merged: Notification[] = [];

    // Real-time notifications first (newest)
    for (const n of realtimeNotifications) {
      if (!seen.has(n.id)) {
        seen.add(n.id);
        merged.push(n);
      }
    }

    // Then stored notifications
    for (const n of storedNotifications) {
      if (!seen.has(n.id)) {
        seen.add(n.id);
        merged.push(n);
      }
    }

    return merged;
  }, [realtimeNotifications, storedNotifications]);

  // Total unread count (max of both to avoid double counting)
  const totalUnreadCount = Math.max(
    realtimeUnreadCount,
    storedUnreadCount,
    allNotifications.filter((n) => !n.read).length
  );

  // Fetch stored notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/notifications?page=0&size=20`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const notifications = (data.items || []).map(toNotification);
        setStoredNotifications(notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, userId]);

  // Fetch unread count on mount
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${apiBaseUrl}/notifications/unread-count`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStoredUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [apiBaseUrl, userId]);

  // Fetch unread count on mount
  useEffect(() => {
    if (userId && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUnreadCount();
    }
  }, [userId, fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Mark as read (both local and API)
  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      // Update local state immediately
      markAsReadLocal(notificationId);
      setStoredNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setStoredUnreadCount((prev) => Math.max(0, prev - 1));

      // Call API
      if (userId) {
        try {
          await fetch(`${apiBaseUrl}/notifications/${notificationId}/read`, {
            method: "PATCH",
            credentials: "include",
          });
        } catch (error) {
          console.error("Failed to mark as read:", error);
        }
      }
    },
    [apiBaseUrl, userId, markAsReadLocal]
  );

  // Mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    // Update local state immediately
    allNotifications.forEach((n) => {
      if (!n.read) {
        markAsReadLocal(n.id);
      }
    });
    setStoredNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setStoredUnreadCount(0);

    // Call API
    if (userId) {
      try {
        await fetch(`${apiBaseUrl}/notifications/mark-all-read`, {
          method: "PATCH",
          credentials: "include",
        });
      } catch (error) {
        console.error("Failed to mark all as read:", error);
      }
    }
  }, [apiBaseUrl, userId, allNotifications, markAsReadLocal]);

  // Remove notification
  const handleRemove = useCallback(
    async (notificationId: string) => {
      // Update local state immediately
      removeLocal(notificationId);
      setStoredNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      // Call API
      if (userId) {
        try {
          await fetch(`${apiBaseUrl}/notifications/${notificationId}`, {
            method: "DELETE",
            credentials: "include",
          });
        } catch (error) {
          console.error("Failed to delete notification:", error);
        }
      }
    },
    [apiBaseUrl, userId, removeLocal]
  );

  // Clear all notifications
  const handleClearAll = useCallback(async () => {
    // Update local state immediately
    clearAllLocal();
    setStoredNotifications([]);
    setStoredUnreadCount(0);

    // Call API
    if (userId) {
      try {
        await fetch(`${apiBaseUrl}/notifications`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch (error) {
        console.error("Failed to clear all notifications:", error);
      }
    }
  }, [apiBaseUrl, userId, clearAllLocal]);

  const handleNotificationClick = (notif: Notification) => {
    handleMarkAsRead(notif.id);

    if (notif.actionUrl) {
      window.location.href = notif.actionUrl;
    }

    setIsOpen(false);
  };

  if (!userId) {
    return null;
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center justify-center size-8 rounded-md transition-colors",
          "hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100",
          isOpen && "bg-custom-background-80 text-custom-text-100"
        )}
        aria-label="Notifications"
      >
        <Bell className="size-4" />

        {/* Unread Badge */}
        {totalUnreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}

        {/* Connection indicator */}
        {isConnecting && (
          <span className="absolute bottom-0 right-0 size-2 bg-yellow-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[380px] max-h-[500px] bg-custom-background-100 rounded-xl shadow-lg border border-custom-border-200 z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-custom-border-200">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-custom-text-100">Notifications</h3>
              {!isConnected && !isConnecting && (
                <span className="text-xs text-red-500">(Offline)</span>
              )}
              {isConnecting && (
                <Loader2 className="size-3 animate-spin text-custom-text-300" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {totalUnreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-xs text-custom-primary-100 hover:text-custom-primary-200 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
              {allNotifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-custom-text-300 hover:text-custom-text-200 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto max-h-[360px]">
            {isLoading && allNotifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-custom-text-300" />
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-custom-text-300">
                <Bell className="size-10 mb-3 opacity-40" />
                <p className="text-sm">No notifications</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-custom-border-100">
                {allNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                      "hover:bg-custom-background-80",
                      !notif.read && "bg-custom-primary-100/5"
                    )}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {/* Unread dot */}
                    <div className="flex-shrink-0 mt-1.5">
                      {!notif.read ? (
                        <div className="size-2 bg-custom-primary-100 rounded-full" />
                      ) : (
                        <div className="size-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-custom-text-100 truncate">
                        {notif.title}
                      </p>
                      <p className="text-xs text-custom-text-300 line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-xs text-custom-text-400 mt-1">
                        {formatRelativeTime(notif.timestamp)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {!notif.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          className="p-1 text-custom-text-300 hover:text-custom-primary-100 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(notif.id);
                        }}
                        className="p-1 text-custom-text-300 hover:text-red-500 rounded transition-colors"
                        title="Remove"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-custom-border-200 text-center">
              <a
                href="/notifications"
                className="text-xs text-custom-primary-100 hover:text-custom-primary-200 font-medium transition-colors"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

NotificationBell.displayName = "NotificationBell";
