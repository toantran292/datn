# Notification Service

## Overview

Notification Service handles real-time notifications via WebSocket (Socket.IO), email sending, and notification persistence. It provides a unified interface for all notification types.

## Architecture

```
Services → Notification API → WebSocket Gateway → Clients
                 ↓
              SMTP (Email)
                 ↓
              PostgreSQL (Stored notifications)
```

## Base URL

- Internal: `http://notification-api:3000`
- WebSocket: `ws://notification-api:3000/notifications/socket.io`
- Port: `3000`

## Notification Types

| Type | Description |
|------|-------------|
| `email` | Send email only |
| `in_app` | Send real-time WebSocket notification only |
| `both` | Send both email and in-app notification |

## Priority Levels

| Priority | Description |
|----------|-------------|
| `low` | Non-urgent, can be batched |
| `medium` | Normal priority (default) |
| `high` | Important, immediate delivery |
| `urgent` | Critical, highest priority |

## REST Endpoints

### Send Single Notification
```http
POST /send
Content-Type: application/json

{
  "type": "in_app",
  "priority": "medium",
  "inApp": {
    "userId": "user-uuid",
    "title": "New Message",
    "message": "You have a new message from John",
    "metadata": {
      "senderId": "john-uuid",
      "conversationId": "conv-uuid"
    },
    "actionUrl": "/messages/conv-uuid"
  }
}
```

### Send Bulk Notifications
```http
POST /send-bulk
Content-Type: application/json

[
  {
    "type": "in_app",
    "inApp": {
      "userId": "user-1",
      "title": "Meeting Starting",
      "message": "Daily standup in 5 minutes"
    }
  },
  {
    "type": "in_app",
    "inApp": {
      "userId": "user-2",
      "title": "Meeting Starting",
      "message": "Daily standup in 5 minutes"
    }
  }
]
```

### Broadcast to All Users
```http
POST /broadcast
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "System will be down for maintenance at 2:00 AM",
  "metadata": {
    "type": "system",
    "duration": "30 minutes"
  }
}
```

### Get Connection Stats
```http
GET /stats
```

Response:
```json
{
  "activeUsers": 150,
  "totalConnections": 200
}
```

### Check User Online Status
```http
GET /user/:userId/online
```

Response:
```json
{
  "userId": "user-uuid",
  "online": true,
  "connections": 2
}
```

### Health Check
```http
GET /health
```

## Send Email Notification

```http
POST /send
Content-Type: application/json

{
  "type": "email",
  "priority": "high",
  "email": {
    "to": "user@example.com",
    "subject": "Your invitation to join Acme Corp",
    "html": "<h1>Welcome!</h1><p>Click below to accept...</p>",
    "text": "Welcome! Click here to accept...",
    "from": "noreply@platform.com",
    "cc": ["admin@example.com"],
    "attachments": [
      {
        "filename": "welcome.pdf",
        "path": "/path/to/file.pdf"
      }
    ]
  }
}
```

## Stored Notifications Endpoints

### Get User Notifications
```http
GET /notifications?page=0&size=20
X-User-Id: user-uuid
```

Response:
```json
{
  "content": [
    {
      "id": "notif-uuid",
      "title": "New Message",
      "message": "You have a new message",
      "read": false,
      "metadata": {},
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "totalElements": 50,
  "totalPages": 3,
  "page": 0,
  "size": 20
}
```

### Get Unread Notifications
```http
GET /notifications/unread
X-User-Id: user-uuid
```

### Get Unread Count
```http
GET /notifications/unread-count
X-User-Id: user-uuid
```

Response:
```json
{
  "count": 5
}
```

### Mark as Read
```http
PATCH /notifications/:id/read
X-User-Id: user-uuid
```

### Mark All as Read
```http
PATCH /notifications/mark-all-read
X-User-Id: user-uuid
```

### Delete Notification
```http
DELETE /notifications/:id
X-User-Id: user-uuid
```

### Delete All Notifications
```http
DELETE /notifications
X-User-Id: user-uuid
```

### Create Notification (Internal)
```http
POST /notifications/internal
Content-Type: application/json

{
  "userId": "user-uuid",
  "title": "Task Assigned",
  "message": "You have been assigned to task #123",
  "type": "task_assigned",
  "metadata": {
    "taskId": "task-123",
    "projectId": "project-uuid"
  },
  "actionUrl": "/tasks/task-123"
}
```

## WebSocket Integration

### Client Connection (JavaScript/TypeScript)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/notifications/socket.io',
  transports: ['websocket'],
});

// Register for notifications
socket.emit('register', { userId: 'current-user-uuid' });

// Listen for registration confirmation
socket.on('registered', (data) => {
  console.log('Registered:', data);
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // {
  //   id: 'notif-123',
  //   title: 'New Message',
  //   message: 'You have a new message',
  //   metadata: { ... },
  //   timestamp: '2024-01-01T00:00:00Z'
  // }
});

// Listen for broadcasts
socket.on('broadcast', (data) => {
  console.log('Broadcast:', data);
});

// Unregister when done
socket.emit('unregister', { userId: 'current-user-uuid' });

// Disconnect
socket.disconnect();
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.NOTIFICATION_URL, {
      path: '/notifications/socket.io',
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('register', { userId });
    });

    newSocket.on('notification', (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unregister', { userId });
      newSocket.disconnect();
    };
  }, [userId]);

  return { notifications, socket };
}
```

## Integration from Other Services

```typescript
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationClient {
  private readonly baseUrl = 'http://notification-api:3000';

  constructor(private http: HttpService) {}

  async sendInApp(userId: string, title: string, message: string, metadata?: any) {
    await firstValueFrom(
      this.http.post(`${this.baseUrl}/send`, {
        type: 'in_app',
        inApp: {
          userId,
          title,
          message,
          metadata,
        },
      })
    );
  }

  async sendEmail(to: string, subject: string, html: string) {
    await firstValueFrom(
      this.http.post(`${this.baseUrl}/send`, {
        type: 'email',
        email: { to, subject, html },
      })
    );
  }

  async notifyWithEmail(
    userId: string,
    email: string,
    title: string,
    message: string,
    html: string
  ) {
    await firstValueFrom(
      this.http.post(`${this.baseUrl}/send`, {
        type: 'both',
        inApp: { userId, title, message },
        email: { to: email, subject: title, html },
      })
    );
  }
}
```

## WebSocket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `register` | `{ userId: string }` | Register for notifications |
| `unregister` | `{ userId: string }` | Unregister from notifications |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `registered` | `{ message, userId }` | Registration confirmed |
| `unregistered` | `{ message, userId }` | Unregistration confirmed |
| `notification` | `{ id, title, message, metadata, timestamp }` | New notification |
| `broadcast` | `{ id, title, message, metadata, timestamp }` | System broadcast |
| `error` | `{ message }` | Error occurred |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | HTTP/WebSocket port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection URL |
| `MAIL_HOST` | Yes | - | SMTP host |
| `MAIL_PORT` | Yes | - | SMTP port |
| `MAIL_USER` | Yes | - | SMTP username |
| `MAIL_PASS` | Yes | - | SMTP password |
| `MAIL_FROM` | No | noreply@... | Default from address |

## Important Notes

- WebSocket path is `/notifications/socket.io` (not root)
- Users must call `register` event to receive notifications
- One user can have multiple socket connections (multi-tab support)
- Notifications are stored in database for persistence
- Unread count is maintained per user
- Broadcast sends to ALL connected clients
