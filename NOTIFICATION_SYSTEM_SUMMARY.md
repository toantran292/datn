# Notification System - Complete Implementation Summary

## Overview

Đã implement complete notification system với:
1. ✅ **Notification Service** - Backend service với email + WebSocket
2. ✅ **API Gateway Integration** - Nginx routing cho WebSocket
3. ✅ **React Package** - `@uts/notifications` cho các FE apps

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                              │
│                                                               │
│  React Apps (Next.js, Vite, CRA)                            │
│  └─ @uts/notifications package                               │
│     ├─ useNotifications() hook                               │
│     ├─ useNotificationConnection() hook                      │
│     └─ NotificationClient class                              │
└──────────────────┬───────────────────────────────────────────┘
                   │ WebSocket (ws://localhost:8080/notifications)
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                  API GATEWAY LAYER                            │
│                                                               │
│  Nginx (Edge Service) - Port 8080                           │
│  ├─ WebSocket upgrade support                                │
│  ├─ Rate limiting (200 req/min)                              │
│  ├─ Long-lived connection timeouts (3600s)                   │
│  ├─ Optional authentication                                  │
│  └─ CORS headers                                              │
└──────────────────┬───────────────────────────────────────────┘
                   │ proxy_pass http://notification-api:3000
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                  SERVICE LAYER                                │
│                                                               │
│  Notification Service - Port 3000                            │
│  ├─ Socket.IO Gateway (/notifications namespace)             │
│  │  ├─ User registration/unregistration                      │
│  │  ├─ Multi-device support                                  │
│  │  ├─ Broadcast support                                     │
│  │  └─ Online status tracking                                │
│  │                                                            │
│  ├─ Email Service (Nodemailer + Mailhog)                     │
│  │  ├─ HTML/Plain text emails                                │
│  │  ├─ CC/BCC support                                        │
│  │  └─ Attachments                                           │
│  │                                                            │
│  └─ REST API                                                  │
│     ├─ POST /notifications/send                              │
│     ├─ POST /notifications/send-bulk                         │
│     ├─ POST /notifications/broadcast                         │
│     ├─ GET  /notifications/stats                             │
│     └─ GET  /notifications/user/:id/online                   │
└───────────────────────────────────────────────────────────────┘
```

## Components

### 1. Backend Service

📂 **Location**: `services/notification/`

**Features**:
- NestJS + TypeScript
- Socket.IO for WebSocket
- Nodemailer for SMTP
- Mailhog integration (development)
- Generic API endpoints
- Health checks
- Docker support

**Key Files**:
- `src/notification/notification.service.ts` - Main business logic
- `src/websocket/notification.gateway.ts` - WebSocket gateway
- `src/email/email.service.ts` - Email service
- `src/dto/send-notification.dto.ts` - DTOs with validation

**Docker Configuration**:
```yaml
# In infra/docker/compose.dev.yml
notification-api:
  build: ../../services/notification
  container_name: uts_notification_api
  environment:
    SMTP_HOST: mailhog
    SMTP_PORT: 1025
  depends_on:
    - mailhog
  networks: [uts_net]
```

### 2. API Gateway Configuration

📂 **Location**: `services/edge/configs/nginx.conf`

**Configuration Added**:
```nginx
upstream notification_api { server notification-api:3000; }

location ~* ^/notifications(/?|/.*)$ {
  limit_req zone=api_rl burst=200 nodelay;

  # WebSocket upgrade headers
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection $connection_upgrade;

  # Long-lived connection timeouts
  proxy_read_timeout 3600s;
  proxy_send_timeout 3600s;

  proxy_pass http://notification_api;
}
```

**Features**:
- WebSocket upgrade support
- Rate limiting (200 requests/min)
- Long-lived connection support (1 hour)
- CORS headers
- Optional authentication (commented out)

### 3. React Package

📂 **Location**: `packages/notifications/`

**Package**: `@uts/notifications`

**Exports**:
```typescript
// Hooks
export { useNotifications }           // Full notification management
export { useNotificationConnection }  // Connection only

// Client
export { NotificationClient }         // Direct client usage

// Types
export type {
  Notification,
  NotificationConfig,
  NotificationState,
  // ... more types
}
```

**Features**:
- TypeScript with full type safety
- React hooks for easy integration
- Auto-reconnection
- State management
- Unread count tracking
- Mark as read/clear functionality

**Key Files**:
- `src/hooks/useNotifications.ts` - Main hook with state
- `src/hooks/useNotificationConnection.ts` - Connection-only hook
- `src/utils/NotificationClient.ts` - WebSocket client wrapper
- `src/types/index.ts` - TypeScript definitions

## API Usage

### For Backend Services

Các service khác call notification service qua HTTP:

```typescript
// Example: Send email when user registers
await httpService.post('http://notification-api:3000/notifications/send', {
  type: 'email',
  email: {
    to: 'user@example.com',
    subject: 'Welcome!',
    html: '<h1>Welcome to UTS!</h1>',
  },
});

// Send both email + in-app notification
await httpService.post('http://notification-api:3000/notifications/send', {
  type: 'both',
  priority: 'high',
  email: {
    to: 'user@example.com',
    subject: 'Order Confirmed',
    html: '<h1>Your order is confirmed</h1>',
  },
  inApp: {
    userId: 'user-123',
    title: 'Order Confirmed',
    message: 'Your order #12345 is being processed',
    metadata: { orderId: '12345' },
    actionUrl: '/orders/12345',
  },
});
```

### For Frontend Apps

```tsx
import { useNotifications } from '@uts/notifications';

function MyComponent() {
  const {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    clearAll,
  } = useNotifications({
    gatewayUrl: 'http://localhost:8080',
    userId: 'user-123',
    debug: true,
  });

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      {notifications.map((notif) => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  );
}
```

## Connection Flow

### WebSocket Connection

1. **Client connects**:
   ```
   ws://localhost:8080/notifications
   ```

2. **Nginx proxies to**:
   ```
   http://notification-api:3000/notifications
   ```

3. **Socket.IO upgrades**:
   - Handshake
   - Protocol upgrade
   - WebSocket established

4. **Client registers**:
   ```javascript
   socket.emit('register', { userId: 'user-123' })
   ```

5. **Server confirms**:
   ```javascript
   socket.on('registered', (data) => {
     console.log('Registered:', data);
   });
   ```

6. **Receive notifications**:
   ```javascript
   socket.on('notification', (notif) => {
     console.log('New notification:', notif);
   });
   ```

## Documentation

### Service Documentation
- **Main README**: `services/notification/README.md`
  - API endpoints
  - WebSocket events
  - Configuration
  - Testing guide

- **Example HTML Client**: `services/notification/examples/client-example.html`
  - Interactive WebSocket demo
  - Can open directly in browser

- **API Examples**: `services/notification/examples/api-examples.http`
  - 15+ example requests
  - Use with REST Client extension

### Package Documentation
- **Main README**: `packages/notifications/README.md`
  - Hook API reference
  - Configuration options
  - Advanced examples
  - Troubleshooting

- **Integration Guide**: `packages/notifications/INTEGRATION_GUIDE.md`
  - Next.js integration (App Router + Pages Router)
  - Vite + React integration
  - CRA integration
  - Environment setup
  - Production deployment
  - Testing guide

- **Examples**:
  - `examples/basic-usage.tsx` - Basic notification panel
  - `examples/toast-integration.tsx` - Toast notifications
  - `examples/dropdown-menu.tsx` - Dropdown menu pattern

## Quick Start

### 1. Start Services

```bash
cd infra/docker
docker-compose -f compose.dev.yml up notification-api mailhog
```

**Services started**:
- Notification API: `http://localhost:3000`
- Mailhog UI: `http://localhost:8025` (check emails)
- API Gateway: `http://localhost:8080`

### 2. Test WebSocket Connection

Open `services/notification/examples/client-example.html` in browser:
1. Enter user ID
2. Click "Connect"
3. Should see "Connected" status

### 3. Send Test Notification

```bash
curl -X POST http://localhost:8080/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "in_app",
    "inApp": {
      "userId": "demo-user",
      "title": "Test Notification",
      "message": "This is a test from curl"
    }
  }'
```

Should see notification appear in browser immediately.

### 4. Integrate in React App

```bash
# Add package
pnpm add @uts/notifications

# Or if using workspace
# Add to package.json: "@uts/notifications": "workspace:*"
```

```tsx
// In your component
import { useNotifications } from '@uts/notifications';

function App() {
  const { notifications, unreadCount } = useNotifications({
    gatewayUrl: 'http://localhost:8080',
    userId: currentUser.id,
    debug: true,
  });

  return <div>Unread: {unreadCount}</div>;
}
```

## Features Checklist

### Backend Service
- ✅ Email notifications (SMTP + Mailhog)
- ✅ Real-time WebSocket notifications
- ✅ Generic REST API endpoints
- ✅ Bulk send support
- ✅ Broadcast to all users
- ✅ Online status tracking
- ✅ Connection statistics
- ✅ Health check endpoints
- ✅ Docker support
- ✅ TypeScript + NestJS
- ✅ Validation with DTOs

### API Gateway
- ✅ WebSocket proxy support
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Long-lived connections
- ✅ Optional authentication ready

### React Package
- ✅ TypeScript with full types
- ✅ React hooks (useNotifications, useNotificationConnection)
- ✅ Auto-reconnection
- ✅ State management
- ✅ Unread count tracking
- ✅ Mark as read/clear/remove
- ✅ Error handling
- ✅ Debug mode
- ✅ Multi-device support
- ✅ Broadcast support

### Documentation
- ✅ Service README
- ✅ Package README
- ✅ Integration guide
- ✅ API examples
- ✅ React examples
- ✅ HTML demo client
- ✅ Architecture diagrams
- ✅ Troubleshooting guide

## Environment Variables

### Notification Service
```env
NODE_ENV=development
PORT=3000
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
EMAIL_FROM=noreply@uts.local
```

### Frontend Apps
```env
# NextJS
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8080

# Vite
VITE_API_GATEWAY_URL=http://localhost:8080

# Create React App
REACT_APP_API_GATEWAY_URL=http://localhost:8080
```

## Testing

### Manual Testing

1. **WebSocket**:
   - Open `services/notification/examples/client-example.html`
   - Connect and send test notifications

2. **Email**:
   - Send email via API
   - Check Mailhog UI at `http://localhost:8025`

3. **API**:
   - Use `services/notification/examples/api-examples.http`
   - With REST Client extension in VS Code

### Integration Testing

```bash
# Test notification endpoint
curl -X POST http://localhost:8080/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"type":"email","email":{"to":"test@example.com","subject":"Test","text":"Hello"}}'

# Test stats endpoint
curl http://localhost:8080/notifications/stats

# Test health
curl http://localhost:8080/notifications/health
```

## Production Considerations

### Security
- [ ] Enable authentication in nginx for `/notifications`
- [ ] Use WSS (secure WebSocket) in production
- [ ] Implement rate limiting per user
- [ ] Validate notification permissions

### Scalability
- [ ] Add Redis for Socket.IO adapter (multi-instance support)
- [ ] Implement notification persistence (database)
- [ ] Add message queue for reliable delivery
- [ ] Set up monitoring and alerts

### Features
- [ ] Notification templates
- [ ] Scheduled notifications
- [ ] User notification preferences
- [ ] Read/unread status persistence
- [ ] Notification history API
- [ ] Push notifications (mobile)

## File Structure

```
.
├── services/
│   ├── notification/              # Backend service
│   │   ├── src/
│   │   │   ├── notification/     # Main module
│   │   │   ├── websocket/        # WebSocket gateway
│   │   │   ├── email/            # Email service
│   │   │   ├── config/           # Configuration
│   │   │   ├── dto/              # DTOs
│   │   │   └── types/            # Types
│   │   ├── examples/             # Examples
│   │   │   ├── client-example.html
│   │   │   └── api-examples.http
│   │   ├── Dockerfile.dev
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── edge/
│       └── configs/
│           └── nginx.conf        # Updated with /notifications route
│
├── packages/
│   └── notifications/            # React package
│       ├── src/
│       │   ├── hooks/           # React hooks
│       │   ├── utils/           # NotificationClient
│       │   └── types/           # TypeScript types
│       ├── examples/            # React examples
│       │   ├── basic-usage.tsx
│       │   ├── toast-integration.tsx
│       │   └── dropdown-menu.tsx
│       ├── package.json
│       ├── README.md
│       └── INTEGRATION_GUIDE.md
│
├── infra/
│   └── docker/
│       └── compose.dev.yml      # Updated with notification-api
│
└── NOTIFICATION_SYSTEM_SUMMARY.md  # This file
```

## Support & Maintenance

- **Service Issues**: Check `services/notification/README.md`
- **Integration Issues**: Check `packages/notifications/INTEGRATION_GUIDE.md`
- **API Reference**: See `services/notification/examples/api-examples.http`
- **React Examples**: See `packages/notifications/examples/`

## Next Steps

To use the notification system:

1. **Backend Services**: Call notification API endpoints
2. **Frontend Apps**: Install `@uts/notifications` and use hooks
3. **Customize**: Modify notification types, add templates, etc.
4. **Scale**: Add Redis, database persistence when needed

The system is designed to be **generic** and **extensible** - business logic stays in calling services, notification service handles delivery only.
