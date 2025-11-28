# @uts/notifications

React hooks và utilities cho real-time notifications trong UTS platform.

## Features

- ✅ **WebSocket connection** qua API Gateway
- ✅ **React hooks** cho easy integration
- ✅ **TypeScript** với full type safety
- ✅ **Auto-reconnection** khi mất kết nối
- ✅ **Notification management** (mark as read, clear, remove)
- ✅ **Broadcast support** cho system-wide announcements
- ✅ **Unread count** tracking
- ✅ **Debug mode** cho development

## Installation

```bash
pnpm add @uts/notifications
```

## Quick Start

### 1. Basic Usage với `useNotifications`

Hook này tự động quản lý connection và notifications state.

```tsx
import { useNotifications } from '@uts/notifications';

function NotificationPanel() {
  const {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    clearAll,
  } = useNotifications({
    gatewayUrl: 'http://localhost:8080',
    userId: 'user-123',
    debug: true, // Enable logging trong dev
  });

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>

      <button onClick={clearAll}>Clear All</button>

      {notifications.map((notif) => (
        <div
          key={notif.id}
          onClick={() => markAsRead(notif.id)}
          style={{
            opacity: notif.read ? 0.5 : 1,
            cursor: 'pointer',
          }}
        >
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          {notif.actionUrl && (
            <a href={notif.actionUrl}>View Details</a>
          )}
          <small>{new Date(notif.timestamp).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
```

### 2. Manual Control với `useNotificationConnection`

Nếu bạn muốn tự quản lý notifications state:

```tsx
import { useNotificationConnection } from '@uts/notifications';
import { useState, useEffect } from 'react';

function CustomNotifications() {
  const { isConnected, client } = useNotificationConnection({
    gatewayUrl: 'http://localhost:8080',
    userId: 'user-123',
  });

  const [latestNotif, setLatestNotif] = useState(null);

  useEffect(() => {
    if (!client) return;

    const unsub = client.onNotification((notif) => {
      setLatestNotif(notif);
      // Custom logic here
      showToast(notif.message);
    });

    return unsub;
  }, [client]);

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      {latestNotif && (
        <div>
          <h3>Latest: {latestNotif.title}</h3>
        </div>
      )}
    </div>
  );
}
```

### 3. Using NotificationClient Directly

Cho non-React use cases:

```typescript
import { NotificationClient } from '@uts/notifications';

const client = new NotificationClient({
  gatewayUrl: 'http://localhost:8080',
  debug: true,
});

client.connect('user-123');

client.onNotification((notif) => {
  console.log('New notification:', notif);
});

client.onBroadcast((broadcast) => {
  console.log('Broadcast:', broadcast);
});

// Later...
client.disconnect();
```

## API Reference

### `useNotifications(options)`

Main hook với full notification management.

#### Options

```typescript
interface UseNotificationsOptions {
  gatewayUrl: string;           // API Gateway URL (required)
  userId: string;                // User ID (required)
  maxNotifications?: number;     // Max notifications to keep (default: 50)
  autoConnect?: boolean;         // Auto-connect on mount (default: true)
  autoReconnect?: boolean;       // Auto-reconnect on disconnect (default: true)
  reconnectionDelay?: number;    // Delay between reconnects in ms (default: 1000)
  reconnectionAttempts?: number; // Max reconnection attempts (default: Infinity)
  debug?: boolean;               // Enable debug logs (default: false)
  authToken?: string;            // Optional auth token
}
```

#### Return Value

```typescript
interface UseNotificationsReturn {
  // State
  notifications: Notification[];
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  unreadCount: number;

  // Actions
  connect: () => void;
  disconnect: () => void;
  markAsRead: (notificationId: string) => void;
  clearAll: () => void;
  remove: (notificationId: string) => void;
}
```

### `useNotificationConnection(options)`

Lightweight hook chỉ quản lý connection.

#### Options

```typescript
interface UseNotificationConnectionOptions {
  gatewayUrl: string;
  userId: string;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  reconnectionDelay?: number;
  reconnectionAttempts?: number;
  debug?: boolean;
  authToken?: string;
}
```

#### Return Value

```typescript
interface UseNotificationConnectionReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  client: NotificationClient | null;
}
```

### Types

```typescript
interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  timestamp: Date | string;
  read?: boolean;
}

interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date | string;
}
```

## Advanced Examples

### Toast Notifications Integration

```tsx
import { useNotifications } from '@uts/notifications';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

function App() {
  const { notifications, isConnected } = useNotifications({
    gatewayUrl: process.env.NEXT_PUBLIC_API_URL,
    userId: user.id,
  });

  // Show toast for new notifications
  useEffect(() => {
    const latest = notifications[0];
    if (latest && !latest.read) {
      toast(latest.message, {
        icon: '🔔',
        duration: 4000,
      });
    }
  }, [notifications]);

  return <div>...</div>;
}
```

### Notification Badge

```tsx
import { useNotifications } from '@uts/notifications';

function NotificationBadge() {
  const { unreadCount } = useNotifications({
    gatewayUrl: 'http://localhost:8080',
    userId: currentUser.id,
  });

  if (unreadCount === 0) return <BellIcon />;

  return (
    <div style={{ position: 'relative' }}>
      <BellIcon />
      <span
        style={{
          position: 'absolute',
          top: -5,
          right: -5,
          background: 'red',
          color: 'white',
          borderRadius: '50%',
          padding: '2px 6px',
          fontSize: '12px',
        }}
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </div>
  );
}
```

### Notification Dropdown

```tsx
import { useNotifications } from '@uts/notifications';
import { useState } from 'react';

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
  } = useNotifications({
    gatewayUrl: process.env.NEXT_PUBLIC_API_URL,
    userId: user.id,
    maxNotifications: 20,
  });

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        <BellIcon />
        {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
      </button>

      {isOpen && (
        <div className="dropdown">
          <div className="header">
            <h3>Notifications</h3>
            <button onClick={clearAll}>Clear All</button>
          </div>

          <div className="list">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={notif.read ? 'read' : 'unread'}
                onClick={() => {
                  markAsRead(notif.id);
                  if (notif.actionUrl) {
                    window.location.href = notif.actionUrl;
                  }
                }}
              >
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <time>{formatTime(notif.timestamp)}</time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### với NextJS App Router

```tsx
'use client';

import { useNotifications } from '@uts/notifications';
import { useSession } from 'next-auth/react';

export function NotificationProvider({ children }) {
  const { data: session } = useSession();

  const notifications = useNotifications({
    gatewayUrl: process.env.NEXT_PUBLIC_API_URL!,
    userId: session?.user?.id || '',
    autoConnect: !!session?.user?.id,
  });

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
}
```

## Architecture

```
Client (React App)
       ↓
       ↓ WebSocket connection
       ↓
API Gateway (Nginx)
  :8080/notifications
       ↓
       ↓ proxy_pass
       ↓
Notification Service
  :3000/notifications
  (Socket.IO namespace)
```

## Connection URL

### Development
```
ws://localhost:8080/notifications
```

### Production
```
wss://api.yourdomain.com/notifications
```

Package tự động xử lý WebSocket upgrade qua API Gateway.

## Troubleshooting

### Connection fails

1. Check API Gateway đang chạy:
   ```bash
   curl http://localhost:8080/healthz
   ```

2. Check notification service:
   ```bash
   curl http://localhost:8080/notifications/health
   ```

3. Enable debug mode:
   ```tsx
   useNotifications({
     // ...
     debug: true,
   })
   ```

### Notifications không nhận được

1. Verify user đã register:
   - Check browser console với `debug: true`
   - Should see "Registered for notifications"

2. Test với API directly:
   ```bash
   curl -X POST http://localhost:8080/notifications/send \
     -H "Content-Type: application/json" \
     -d '{
       "type": "in_app",
       "inApp": {
         "userId": "user-123",
         "title": "Test",
         "message": "Hello"
       }
     }'
   ```

## Development

```bash
# Build package
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm check:types

# Lint
pnpm check:lint
```

## License

Private - UTS Platform
