/**
 * Basic usage example of @uts/notifications
 *
 * This example shows:
 * - Simple notification panel
 * - Mark as read functionality
 * - Clear all notifications
 * - Unread count badge
 */

import React from 'react';
import { useNotifications } from '@uts/notifications';

export function BasicNotificationPanel() {
  const {
    notifications,
    isConnected,
    isConnecting,
    unreadCount,
    markAsRead,
    clearAll,
    error,
  } = useNotifications({
    gatewayUrl: 'http://localhost:8080',
    userId: 'demo-user',
    debug: true,
    maxNotifications: 20,
  });

  if (error) {
    return (
      <div className="error">
        <h2>Connection Error</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  if (isConnecting) {
    return <div>Connecting to notification service...</div>;
  }

  return (
    <div className="notification-panel">
      <div className="header">
        <h2>
          Notifications
          {unreadCount > 0 && (
            <span className="badge">{unreadCount}</span>
          )}
        </h2>

        <div className="actions">
          <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
          <button onClick={clearAll} disabled={notifications.length === 0}>
            Clear All
          </button>
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <p className="empty">No notifications</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${notif.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(notif.id)}
            >
              <div className="content">
                <h3>{notif.title}</h3>
                <p>{notif.message}</p>

                {notif.metadata && (
                  <div className="metadata">
                    <pre>{JSON.stringify(notif.metadata, null, 2)}</pre>
                  </div>
                )}

                {notif.actionUrl && (
                  <a
                    href={notif.actionUrl}
                    className="action-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Details →
                  </a>
                )}
              </div>

              <time className="timestamp">
                {new Date(notif.timestamp).toLocaleString()}
              </time>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .notification-panel {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header h2 {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .badge {
          background: #ff4444;
          color: white;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 14px;
        }

        .actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .status {
          font-size: 14px;
        }

        .status.connected {
          color: #22c55e;
        }

        .status.disconnected {
          color: #ef4444;
        }

        button {
          padding: 8px 16px;
          border-radius: 4px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
        }

        button:hover:not(:disabled) {
          background: #f3f4f6;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .empty {
          text-align: center;
          color: #999;
          padding: 40px;
        }

        .notification-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .notification-item:hover {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .notification-item.unread {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
        }

        .notification-item.read {
          opacity: 0.7;
        }

        .content h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .content p {
          margin: 0 0 8px 0;
          color: #666;
        }

        .metadata {
          background: #f9fafb;
          padding: 8px;
          border-radius: 4px;
          margin: 8px 0;
        }

        .metadata pre {
          margin: 0;
          font-size: 12px;
          color: #666;
        }

        .action-link {
          display: inline-block;
          color: #3b82f6;
          text-decoration: none;
          font-size: 14px;
          margin-top: 8px;
        }

        .action-link:hover {
          text-decoration: underline;
        }

        .timestamp {
          display: block;
          font-size: 12px;
          color: #999;
          margin-top: 8px;
        }

        .error {
          padding: 20px;
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          color: #c33;
        }
      `}</style>
    </div>
  );
}

export default BasicNotificationPanel;
