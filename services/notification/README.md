# Notification Service

Generic notification service với 2 tính năng chính:
- **Email Notifications**: Gửi email qua SMTP (sử dụng Mailhog trong môi trường dev)
- **Real-time In-App Notifications**: WebSocket notifications cho người dùng đang online

## Kiến trúc

Service này được xây dựng theo mô hình generic để các service khác có thể gọi API endpoints để gửi notifications. Logic nghiệp vụ nằm ở các service gọi, notification service chỉ đảm nhiệm việc gửi.

### Tech Stack
- **NestJS**: Framework chính
- **Socket.IO**: WebSocket cho real-time notifications
- **Nodemailer**: SMTP email client
- **TypeScript**: Type safety
- **Mailhog**: SMTP testing server (dev environment)

## Cấu trúc thư mục

```
src/
├── config/           # Configuration files
│   └── email.config.ts
├── dto/              # Data Transfer Objects
│   └── send-notification.dto.ts
├── email/            # Email service
│   ├── email.module.ts
│   └── email.service.ts
├── notification/     # Main notification module
│   ├── notification.controller.ts
│   ├── notification.module.ts
│   └── notification.service.ts
├── types/            # TypeScript type definitions
│   └── notification.types.ts
├── websocket/        # WebSocket gateway
│   ├── notification.gateway.ts
│   └── websocket.module.ts
├── app.module.ts
└── main.ts
```

## API Endpoints

### 1. Send Single Notification
```http
POST /notifications/send
Content-Type: application/json

{
  "type": "email" | "in_app" | "both",
  "priority": "low" | "medium" | "high" | "urgent",
  "email": {
    "to": "user@example.com",
    "subject": "Welcome!",
    "text": "Plain text content",
    "html": "<h1>HTML content</h1>"
  },
  "inApp": {
    "userId": "user-123",
    "title": "New notification",
    "message": "You have a new message",
    "metadata": { "orderId": "123" },
    "actionUrl": "https://app.com/orders/123"
  }
}
```

### 2. Send Bulk Notifications
```http
POST /notifications/send-bulk
Content-Type: application/json

[
  { "type": "email", "email": {...} },
  { "type": "in_app", "inApp": {...} }
]
```

### 3. Broadcast to All Users
```http
POST /notifications/broadcast
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "The system will be down for maintenance",
  "metadata": { "scheduledAt": "2024-01-01T00:00:00Z" }
}
```

### 4. Get Connection Stats
```http
GET /notifications/stats

Response:
{
  "activeUsers": 42,
  "totalConnections": 58,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 5. Check User Online Status
```http
GET /notifications/user/:userId/online

Response:
{
  "userId": "user-123",
  "isOnline": true,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 6. Health Check
```http
GET /notifications/health

Response:
{
  "status": "ok",
  "service": "notification-api",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## WebSocket Connection

### Client Connection (JavaScript)
```javascript
import { io } from 'socket.io-client';

// Connect to notification service
const socket = io('http://localhost:3000/notifications', {
  transports: ['websocket'],
  reconnection: true,
});

// Register user to receive notifications
socket.emit('register', { userId: 'user-123' });

// Listen for registration confirmation
socket.on('registered', (data) => {
  console.log('Registered:', data);
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // {
  //   id: "notif-1234567890-abc123",
  //   userId: "user-123",
  //   title: "New Message",
  //   message: "You have received a new message",
  //   metadata: { ... },
  //   actionUrl: "https://app.com/messages",
  //   timestamp: "2024-01-01T12:00:00Z"
  // }
});

// Listen for broadcasts
socket.on('broadcast', (notification) => {
  console.log('Broadcast:', notification);
});

// Unregister when done
socket.emit('unregister', { userId: 'user-123' });
```

### Client Connection (React Hook Example)
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

function useNotifications(userId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000/notifications');
    setSocket(newSocket);

    // Register user
    newSocket.emit('register', { userId });

    // Listen for notifications
    newSocket.on('notification', (notification) => {
      setNotifications((prev) => [...prev, notification]);
    });

    return () => {
      newSocket.emit('unregister', { userId });
      newSocket.close();
    };
  }, [userId]);

  return { notifications, socket };
}
```

## Sử dụng từ các Service khác

### Example: Gửi email khi user đăng ký
```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(private readonly httpService: HttpService) {}

  async registerUser(email: string, name: string) {
    // ... logic đăng ký user ...

    // Gửi email chào mừng
    await this.sendWelcomeEmail(email, name);
  }

  private async sendWelcomeEmail(email: string, name: string) {
    const notificationServiceUrl = 'http://notification-api:3000';

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${notificationServiceUrl}/notifications/send`, {
          type: 'email',
          priority: 'medium',
          email: {
            to: email,
            subject: 'Welcome to UTS Platform!',
            html: `
              <h1>Welcome ${name}!</h1>
              <p>Thank you for registering with us.</p>
            `,
          },
        }),
      );

      console.log('Welcome email sent:', response.data);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Handle error appropriately
    }
  }
}
```

### Example: Gửi in-app notification khi có order mới
```typescript
@Injectable()
export class OrderService {
  constructor(private readonly httpService: HttpService) {}

  async createOrder(userId: string, orderData: any) {
    // ... logic tạo order ...

    const order = await this.orderRepository.save(orderData);

    // Gửi notification cho user
    await this.notifyNewOrder(userId, order);

    return order;
  }

  private async notifyNewOrder(userId: string, order: any) {
    const notificationServiceUrl = 'http://notification-api:3000';

    try {
      await firstValueFrom(
        this.httpService.post(`${notificationServiceUrl}/notifications/send`, {
          type: 'both', // Gửi cả email và in-app
          priority: 'high',
          email: {
            to: order.userEmail,
            subject: 'Order Confirmation',
            html: `<h1>Your order #${order.id} has been confirmed</h1>`,
          },
          inApp: {
            userId,
            title: 'Order Confirmed',
            message: `Your order #${order.id} has been confirmed and is being processed`,
            metadata: {
              orderId: order.id,
              amount: order.total,
            },
            actionUrl: `/orders/${order.id}`,
          },
        }),
      );
    } catch (error) {
      console.error('Failed to send order notification:', error);
    }
  }
}
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# SMTP Configuration (Mailhog in dev)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=          # Optional
SMTP_PASSWORD=      # Optional
EMAIL_FROM=noreply@uts.local
```

## Development

### Cài đặt dependencies
```bash
cd services/notification
pnpm install
```

### Chạy trong Docker
```bash
cd infra/docker
docker-compose -f compose.dev.yml up notification-api
```

### Xem Mailhog UI
Truy cập http://localhost:8025 để xem emails đã gửi (port có thể khác tùy config)

## Testing

### Test email endpoint
```bash
curl -X POST http://localhost:3000/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "email": {
      "to": "test@example.com",
      "subject": "Test Email",
      "text": "This is a test email"
    }
  }'
```

### Test WebSocket connection
```bash
# Install wscat: npm install -g wscat
wscat -c ws://localhost:3000/notifications
> {"event": "register", "data": {"userId": "test-user"}}
```

## Features

### Email Service
- ✅ SMTP support với Nodemailer
- ✅ HTML và plain text emails
- ✅ CC/BCC support
- ✅ File attachments
- ✅ Custom from address
- ✅ Integration với Mailhog cho testing

### Real-time Notifications
- ✅ WebSocket với Socket.IO
- ✅ User registration/authentication
- ✅ Multi-device support (một user có thể connect từ nhiều devices)
- ✅ Broadcast notifications
- ✅ Online status tracking
- ✅ Connection statistics

### API Features
- ✅ Generic endpoints cho tất cả services
- ✅ Bulk notifications
- ✅ Priority levels
- ✅ Validation với class-validator
- ✅ Health check endpoint
- ✅ Error handling

## Future Enhancements

- [ ] Persistent notification storage (database)
- [ ] Notification templates
- [ ] Scheduled notifications
- [ ] Notification preferences per user
- [ ] Push notifications (mobile)
- [ ] SMS notifications
- [ ] Notification read/unread status
- [ ] Notification history API
- [ ] Rate limiting
- [ ] Message queue integration (Redis/Kafka)
