/**
 * Example: Notification dropdown menu
 *
 * Common UI pattern for displaying notifications in a dropdown
 * Similar to Facebook, Twitter, GitHub notification menus
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@uts/notifications';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    isConnected,
  } = useNotifications({
    gatewayUrl: 'http://localhost:8080',
    userId: 'demo-user',
    maxNotifications: 15,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);

    // Navigate to action URL if exists
    if (notif.actionUrl) {
      window.location.href = notif.actionUrl;
    }

    setIsOpen(false);
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            <div className="header-actions">
              {!isConnected && (
                <span className="offline-indicator">Offline</span>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="clear-button">
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="dropdown-body">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <time>
                      {formatRelativeTime(new Date(notif.timestamp))}
                    </time>
                  </div>
                  {!notif.read && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="dropdown-footer">
              <a href="/notifications" className="view-all-link">
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .notification-dropdown {
          position: relative;
        }

        .notification-button {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          color: #374151;
          transition: background-color 0.2s;
        }

        .notification-button:hover {
          background-color: #f3f4f6;
        }

        .badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #ef4444;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 600;
          min-width: 18px;
          text-align: center;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 380px;
          max-height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .dropdown-header {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dropdown-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .offline-indicator {
          font-size: 12px;
          color: #ef4444;
        }

        .clear-button {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .clear-button:hover {
          text-decoration: underline;
        }

        .dropdown-body {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }

        .empty-state {
          padding: 48px 24px;
          text-align: center;
          color: #9ca3af;
        }

        .empty-state svg {
          margin: 0 auto 16px;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        .notification-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          gap: 12px;
        }

        .notification-item:hover {
          background-color: #f9fafb;
        }

        .notification-item.unread {
          background-color: #eff6ff;
        }

        .notification-content {
          flex: 1;
        }

        .notification-content h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .notification-content p {
          margin: 0 0 4px 0;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.4;
        }

        .notification-content time {
          font-size: 12px;
          color: #9ca3af;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .dropdown-footer {
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .view-all-link {
          color: #3b82f6;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }

        .view-all-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default NotificationDropdown;
