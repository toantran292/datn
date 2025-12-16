/**
 * Example: Integration with toast notifications
 *
 * Shows how to display toast notifications when new notifications arrive
 * Using react-hot-toast or similar library
 */

import React, { useEffect } from 'react';
import { useNotifications } from '@uts/notifications';
// import { toast } from 'react-hot-toast';

export function ToastNotificationExample() {
  const {
    notifications,
    isConnected,
    unreadCount,
  } = useNotifications({
    gatewayUrl: 'http://localhost:8080',
    userId: 'demo-user',
  });

  // Show toast for new notifications
  useEffect(() => {
    const latestNotif = notifications[0];

    // Only show toast for unread notifications
    if (latestNotif && !latestNotif.read) {
      // Uncomment when using react-hot-toast:
      // toast(latestNotif.message, {
      //   icon: '🔔',
      //   duration: 4000,
      //   position: 'top-right',
      // });

      // Or use browser notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(latestNotif.title, {
          body: latestNotif.message,
          icon: '/notification-icon.png',
          badge: '/badge-icon.png',
        });
      }

      // Or custom toast implementation
      showCustomToast(latestNotif);
    }
  }, [notifications]);

  return (
    <div className="app">
      <header>
        <h1>My App</h1>
        <div className="notification-indicator">
          <span className="icon">🔔</span>
          {unreadCount > 0 && (
            <span className="badge">{unreadCount}</span>
          )}
        </div>
        <span className={`status ${isConnected ? 'online' : 'offline'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </header>

      <main>
        {/* Your app content */}
        <p>New notifications will appear as toasts</p>
      </main>
    </div>
  );
}

// Custom toast implementation
function showCustomToast(notification: any) {
  const toast = document.createElement('div');
  toast.className = 'custom-toast';
  toast.innerHTML = `
    <div class="toast-content">
      <strong>${notification.title}</strong>
      <p>${notification.message}</p>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Request notification permission on mount
export function useNotificationPermission() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
}

export default ToastNotificationExample;
