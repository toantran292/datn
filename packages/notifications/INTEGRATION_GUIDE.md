# Integration Guide

Hướng dẫn tích hợp `@uts/notifications` vào các FE applications.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Installation](#installation)
- [NextJS Integration](#nextjs-integration)
- [React SPA Integration](#react-spa-integration)
- [Environment Configuration](#environment-configuration)
- [Testing](#testing)
- [Production Deployment](#production-deployment)

## Architecture Overview

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
└────────┬────────┘
         │
         │ WebSocket (via @uts/notifications)
         │
         ↓
┌─────────────────┐
│  API Gateway    │  ← http://localhost:8080
│   (Nginx)       │     /notifications → WebSocket upgrade
└────────┬────────┘
         │
         │ proxy_pass
         │
         ↓
┌─────────────────┐
│ Notification    │
│    Service      │  ← notification-api:3000
│  (Socket.IO)    │     /notifications namespace
└─────────────────┘
```

### Key Points

1. **Client kết nối tới API Gateway** (`http://localhost:8080/notifications`)
2. **Nginx proxy tới notification service** (transparent cho client)
3. **Socket.IO namespace** `/notifications` được dùng cho routing
4. **Authentication** optional - có thể enable ở nginx layer

## Installation

### 1. Add package dependency

Trong app của bạn (Next.js, React, etc.):

```bash
pnpm add @uts/notifications
```

Hoặc nếu dùng workspace:

```json
// package.json
{
  "dependencies": {
    "@uts/notifications": "workspace:*"
  }
}
```

### 2. Install peer dependencies

Package requires:
- `react` >= 18.0.0
- `socket.io-client` >= 4.8.0

Nếu chưa có, install:

```bash
pnpm add socket.io-client
```

## NextJS Integration

### App Router (NextJS 13+)

#### 1. Create Notification Provider

```tsx
// app/providers/notification-provider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import {
  useNotifications,
  UseNotificationsReturn,
} from '@uts/notifications';

const NotificationContext = createContext<UseNotificationsReturn | null>(null);

interface NotificationProviderProps {
  userId: string;
  children: ReactNode;
}

export function NotificationProvider({
  userId,
  children,
}: NotificationProviderProps) {
  const notifications = useNotifications({
    gatewayUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080',
    userId,
    debug: process.env.NODE_ENV === 'development',
    maxNotifications: 50,
  });

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within NotificationProvider'
    );
  }
  return context;
}
```

#### 2. Add to Root Layout

```tsx
// app/layout.tsx
import { NotificationProvider } from './providers/notification-provider';
import { auth } from '@/lib/auth'; // Your auth system

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        {session?.user?.id ? (
          <NotificationProvider userId={session.user.id}>
            {children}
          </NotificationProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
```

#### 3. Use in Components

```tsx
// app/components/notification-bell.tsx
'use client';

import { useNotificationContext } from '@/app/providers/notification-provider';

export function NotificationBell() {
  const { unreadCount, isConnected } = useNotificationContext();

  return (
    <button className="relative">
      <BellIcon />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2">
          {unreadCount}
        </span>
      )}
      {!isConnected && (
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-gray-400 rounded-full" />
      )}
    </button>
  );
}
```

### Pages Router (NextJS 12)

#### 1. Create Hook Wrapper

```tsx
// lib/hooks/use-app-notifications.ts
import { useNotifications } from '@uts/notifications';
import { useSession } from 'next-auth/react';

export function useAppNotifications() {
  const { data: session } = useSession();

  return useNotifications({
    gatewayUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL!,
    userId: session?.user?.id || '',
    autoConnect: !!session?.user?.id,
    debug: process.env.NODE_ENV === 'development',
  });
}
```

#### 2. Use in Components

```tsx
// components/NotificationPanel.tsx
import { useAppNotifications } from '@/lib/hooks/use-app-notifications';

export function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
  } = useAppNotifications();

  // ... rest of component
}
```

## React SPA Integration

### Vite + React

#### 1. Create Notification Context

```tsx
// src/contexts/NotificationContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useNotifications, UseNotificationsReturn } from '@uts/notifications';
import { useAuth } from './AuthContext';

const NotificationContext = createContext<UseNotificationsReturn | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const notifications = useNotifications({
    gatewayUrl: import.meta.env.VITE_API_GATEWAY_URL,
    userId: user?.id || '',
    autoConnect: !!user?.id,
    debug: import.meta.env.DEV,
  });

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};
```

#### 2. Add to App

```tsx
// src/App.tsx
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          {/* Your routes */}
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
```

### Create React App

Same as Vite, nhưng env variables dùng `REACT_APP_` prefix:

```tsx
gatewayUrl: process.env.REACT_APP_API_GATEWAY_URL
```

## Environment Configuration

### Development (.env.local)

```env
# NextJS
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8080

# Vite
VITE_API_GATEWAY_URL=http://localhost:8080

# Create React App
REACT_APP_API_GATEWAY_URL=http://localhost:8080
```

### Production

```env
# Production API Gateway
NEXT_PUBLIC_API_GATEWAY_URL=https://api.yourdomain.com

# Enable secure WebSocket
NEXT_PUBLIC_WS_SECURE=true
```

### Configuration Options

```tsx
useNotifications({
  // Required
  gatewayUrl: string,           // API Gateway URL
  userId: string,                // Current user ID

  // Optional
  maxNotifications: 50,          // Max notifications in state
  autoConnect: true,             // Auto-connect on mount
  autoReconnect: true,           // Auto-reconnect on disconnect
  reconnectionDelay: 1000,       // Delay between reconnects (ms)
  reconnectionAttempts: Infinity, // Max reconnect attempts
  debug: false,                  // Enable debug logs
  authToken: undefined,          // Optional auth token
})
```

## Common Patterns

### 1. Notification Toast

```tsx
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function NotificationToast() {
  const { notifications } = useNotificationContext();

  useEffect(() => {
    const latest = notifications[0];
    if (latest && !latest.read) {
      toast(latest.message, {
        icon: '🔔',
        duration: 4000,
      });
    }
  }, [notifications]);

  return null;
}
```

### 2. Notification Badge

```tsx
export function NotificationBadge() {
  const { unreadCount } = useNotificationContext();

  if (unreadCount === 0) return <BellIcon />;

  return (
    <div className="relative">
      <BellIcon />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-2 text-xs">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </div>
  );
}
```

### 3. Notification Center Page

```tsx
// app/notifications/page.tsx
'use client';

import { useNotificationContext } from '@/app/providers/notification-provider';

export default function NotificationsPage() {
  const {
    notifications,
    markAsRead,
    clearAll,
    unreadCount,
  } = useNotificationContext();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </h1>
        <button onClick={clearAll}>Clear All</button>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => markAsRead(notif.id)}
            className={notif.read ? 'opacity-60' : ''}
          >
            <h3>{notif.title}</h3>
            <p>{notif.message}</p>
            <time>{new Date(notif.timestamp).toLocaleString()}</time>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Testing

### Test with Mock Data

```tsx
// __tests__/notifications.test.tsx
import { render, screen } from '@testing-library/react';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Mock the hook
jest.mock('@uts/notifications', () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: '1',
        title: 'Test',
        message: 'Test message',
        timestamp: new Date(),
        read: false,
      },
    ],
    unreadCount: 1,
    isConnected: true,
    // ... other mock values
  }),
}));

test('renders notifications', () => {
  render(
    <NotificationProvider userId="test">
      <NotificationBell />
    </NotificationProvider>
  );

  expect(screen.getByText('1')).toBeInTheDocument();
});
```

### Manual Testing

1. Start services:
```bash
cd infra/docker
docker-compose -f compose.dev.yml up
```

2. Test connection:
```bash
# Check gateway
curl http://localhost:8080/healthz

# Check notification service
curl http://localhost:8080/notifications/health
```

3. Send test notification:
```bash
curl -X POST http://localhost:8080/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "in_app",
    "inApp": {
      "userId": "your-user-id",
      "title": "Test Notification",
      "message": "This is a test"
    }
  }'
```

## Production Deployment

### 1. Build Configuration

Ensure env variables are set:

```bash
# .env.production
NEXT_PUBLIC_API_GATEWAY_URL=https://api.yourdomain.com
```

### 2. HTTPS/WSS

Nginx sẽ tự động upgrade:
- `http://` → `ws://`
- `https://` → `wss://`

### 3. CORS Configuration

Nginx đã config CORS. Nếu cần customize, update [nginx.conf](../../services/edge/configs/nginx.conf).

### 4. Monitoring

```tsx
// Add error tracking
const { error, isConnected } = useNotifications({
  // ...
  onError: (err) => {
    // Send to Sentry, DataDog, etc.
    console.error('Notification error:', err);
  },
});
```

## Troubleshooting

### Connection không thành công

1. Check API Gateway:
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
  debug: true, // Will log all events to console
})
```

### Notifications không nhận được

1. Verify userId đúng
2. Test trực tiếp với curl (xem phần Testing)
3. Check browser console với debug mode
4. Verify network tab trong DevTools

### Re-connection issues

```tsx
useNotifications({
  autoReconnect: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5, // Limit attempts
})
```

## Best Practices

1. **Always provide userId** - Required để register nhận notifications
2. **Use Context/Provider pattern** - Share notification state across app
3. **Enable debug in dev** - Easier troubleshooting
4. **Limit maxNotifications** - Prevent memory issues
5. **Handle connection errors** - Show user-friendly messages
6. **Mark as read on interaction** - Better UX
7. **Use toast for new notifications** - Don't miss important updates

## Examples

See [examples/](./examples/) directory:
- `basic-usage.tsx` - Simple notification panel
- `toast-integration.tsx` - Toast notifications
- `dropdown-menu.tsx` - Dropdown UI pattern

## Support

- Documentation: [README.md](./README.md)
- Service docs: [../../services/notification/README.md](../../services/notification/README.md)
- Issues: Create issue in project repository
