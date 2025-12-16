# Kế hoạch triển khai Mention & Notification

## Tổng quan

Triển khai tính năng mention trong chat với notification real-time khi user được mention.

## Kiến trúc hiện tại

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   chat-web      │ ──────────────────▶│  chat-service   │
│  (Frontend)     │   send_message     │   (Backend)     │
│                 │   { content: HTML }│                 │
└─────────────────┘                    └─────────────────┘
                                              │
                                              │ (Chưa có)
                                              ▼
                                       ┌─────────────────┐
                                       │ notification-   │
                                       │ service         │
                                       └─────────────────┘
```

## Kiến trúc mới

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   chat-web      │ ──────────────────▶│  chat-service   │
│  (Frontend)     │   send_message     │   (Backend)     │
│                 │   {                │                 │
│  - Extract IDs  │     content: HTML, │  - Lưu message  │
│  - Gửi kèm msg  │     mentionIds: [] │  - Gọi notif    │
└─────────────────┘   }                └────────┬────────┘
                                              │
                                              │ HTTP/gRPC
                                              ▼
                                       ┌─────────────────┐
                                       │ notification-   │
                                       │ service         │
                                       │                 │
                                       │ - Tạo notif     │
                                       │ - Push realtime │
                                       └─────────────────┘
```

---

## Phase 1: Frontend - Extract và gửi mention IDs

### 1.1 Thêm method getMentionedUserIds vào RichTextEditor

**File:** `apps/chat-web/src/components/chat/RichTextEditor.tsx`

```typescript
// Thêm vào RichTextEditorRef interface
export interface RichTextEditorRef {
  getHtml: () => string;
  getText: () => string;
  getMentionedUserIds: () => string[];  // NEW
  clear: () => void;
  focus: () => void;
  getEditorRef: () => EditorRefApi | null;
}

// Implement trong useImperativeHandle
useImperativeHandle(ref, () => ({
  // ... existing methods
  getMentionedUserIds: () => {
    const html = editorRef.current?.getDocument()?.html || "";
    // Parse HTML để extract data-entity-id từ mentions
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const mentions = doc.querySelectorAll('[data-entity-name="user_mention"]');
    const userIds: string[] = [];
    mentions.forEach((el) => {
      const id = el.getAttribute("data-entity-identifier");
      if (id && !userIds.includes(id)) {
        userIds.push(id);
      }
    });
    return userIds;
  },
}), []);
```

### 1.2 Update MessageComposer để gửi mentionIds

**File:** `apps/chat-web/src/components/chat/MessageComposer.tsx`

```typescript
// Update interface
export interface MessageComposerProps {
  // ... existing props
  onSendMessage: (html: string, mentionedUserIds?: string[]) => void;  // UPDATED
}

// Update handleSubmitRef
handleSubmitRef.current = () => {
  const html = editorRef.current?.getHtml() || "";
  const text = editorRef.current?.getText() || "";
  const mentionedUserIds = editorRef.current?.getMentionedUserIds() || [];

  if (!text.trim() && pendingFilesRef.current.length === 0) return;

  onSendMessageRef.current(html, mentionedUserIds);  // Pass mention IDs
  editorRef.current?.clear();
  setHasContent(false);
};
```

### 1.3 Update ChatContext

**File:** `apps/chat-web/src/contexts/ChatContext.tsx`

```typescript
// Update handleSendMessage
const handleSendMessage = async (content: string, mentionedUserIds?: string[]) => {
  if (!selectedRoomId) return;

  const completedUploads = pendingFiles.filter(
    (f) => f.status === 'completed' && f.assetId
  );

  if (completedUploads.length > 0) {
    const attachmentIds = completedUploads
      .map((f) => f.assetId)
      .filter((id): id is string => !!id);

    socketService.sendMessage(selectedRoomId, content, undefined, attachmentIds, mentionedUserIds);
    // ... cleanup
  } else {
    socketService.sendMessage(selectedRoomId, content, undefined, undefined, mentionedUserIds);
  }
};
```

### 1.4 Update Socket Service

**File:** `apps/chat-web/src/services/socket.ts`

```typescript
sendMessage(
  roomId: string,
  content: string,
  threadId?: string,
  attachmentIds?: string[],
  mentionedUserIds?: string[]  // NEW
) {
  if (!this.socket?.connected) {
    console.error('Socket not connected');
    return;
  }
  this.socket.emit('send_message', {
    roomId,
    content,
    threadId,
    attachmentIds,
    mentionedUserIds  // NEW
  });
}
```

---

## Phase 2: Backend Chat Service - Nhận và forward mentions

### 2.1 Update DTO

**File:** `services/chat/src/chat/dto/send-message.dto.ts` (tạo mới nếu chưa có)

```typescript
export class SendMessageDto {
  roomId: string;
  content: string;
  threadId?: string;
  attachmentIds?: string[];
  mentionedUserIds?: string[];  // NEW
}
```

### 2.2 Update Chat Gateway

**File:** `services/chat/src/chat/chat.gateway.ts`

```typescript
@SubscribeMessage('send_message')
async handleSendMessage(
  @MessageBody()
  data: {
    roomId: string;
    content: string;
    threadId?: string;
    attachmentIds?: string[];
    mentionedUserIds?: string[];  // NEW
  },
  @ConnectedSocket() client: AuthenticatedSocket
) {
  const message = await this.chatsService.createMessage({
    roomId: data.roomId,
    userId: client.userId,
    orgId: client.orgId,
    content: data.content,
    threadId: data.threadId,
  });

  // Broadcast message
  const roomChannel = `room:${data.roomId}`;
  this.io.to(roomChannel).emit('message:new', message);

  // NEW: Send mention notifications
  if (data.mentionedUserIds?.length) {
    await this.chatsService.sendMentionNotifications({
      messageId: message.id,
      roomId: data.roomId,
      senderId: client.userId,
      senderName: client.displayName || 'Someone',
      mentionedUserIds: data.mentionedUserIds,
      messagePreview: data.content.substring(0, 100),
      orgId: client.orgId,
    });
  }

  return message;
}
```

### 2.3 Update Chat Service

**File:** `services/chat/src/chat/chat.service.ts`

```typescript
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ChatsService {
  constructor(
    // ... existing deps
    private readonly httpService: HttpService,
    @Inject('NOTIFICATION_SERVICE_URL') private readonly notificationUrl: string,
  ) {}

  async sendMentionNotifications(data: {
    messageId: string;
    roomId: string;
    senderId: string;
    senderName: string;
    mentionedUserIds: string[];
    messagePreview: string;
    orgId: string;
  }) {
    // Filter out self-mentions
    const userIdsToNotify = data.mentionedUserIds.filter(id => id !== data.senderId);

    if (userIdsToNotify.length === 0) return;

    try {
      // Get room info for notification context
      const room = await this.roomsRepo.findById(data.roomId);
      const roomName = room?.name || 'a conversation';

      // Send notifications
      await Promise.all(userIdsToNotify.map(userId =>
        this.httpService.post(`${this.notificationUrl}/notifications/send`, {
          userId,
          type: 'CHAT_MENTION',
          title: `${data.senderName} mentioned you`,
          message: `in ${roomName}: "${this.stripHtml(data.messagePreview)}..."`,
          metadata: {
            messageId: data.messageId,
            roomId: data.roomId,
            senderId: data.senderId,
          },
          actionUrl: `/chat/${data.roomId}?messageId=${data.messageId}`,
          channels: ['in_app'],
        }).toPromise()
      ));
    } catch (error) {
      console.error('Failed to send mention notifications:', error);
      // Don't throw - notification failure shouldn't fail message sending
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
```

---

## Phase 3: Backend Notification Service - Handle mention notifications

### 3.1 Add CHAT_MENTION type

**File:** `services/notification/src/persistence/entities/notification.entity.ts`

```typescript
export enum StoredNotificationType {
  // ... existing types

  // Chat
  CHAT_MENTION = 'CHAT_MENTION',  // NEW
}
```

### 3.2 Update DTO

**File:** `services/notification/src/dto/send-notification.dto.ts`

```typescript
export class SendNotificationDto {
  userId: string;
  type: string;  // StoredNotificationType
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  channels: ('email' | 'in_app')[];
}
```

### 3.3 Handle in Notification Service

**File:** `services/notification/src/notification/notification.service.ts`

```typescript
async sendNotification(dto: SendNotificationDto) {
  const { userId, type, title, message, metadata, actionUrl, channels } = dto;

  // Store notification
  if (channels.includes('in_app')) {
    await this.storedNotificationService.createNotification({
      userId,
      type: type as StoredNotificationType,
      title,
      message,
      metadata,
      actionUrl,
    });

    // Send real-time via WebSocket
    this.notificationGateway.sendToUser(userId, {
      userId,
      title,
      message,
      metadata,
      actionUrl,
    });
  }

  // Send email if needed
  if (channels.includes('email')) {
    // await this.emailService.sendEmail(...)
  }
}
```

---

## Phase 4: Frontend - Hiển thị notifications

### 4.1 Listen notification events

**File:** `apps/chat-web/src/hooks/useNotifications.ts` (tạo mới)

```typescript
import { useEffect, useState } from 'react';
import { notificationSocket } from '../services/notification-socket';

export interface Notification {
  id: string;
  title: string;
  message: string;
  metadata?: {
    messageId?: string;
    roomId?: string;
    senderId?: string;
  };
  actionUrl?: string;
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
        });
      }
    };

    notificationSocket.on('notification', handleNotification);

    return () => {
      notificationSocket.off('notification', handleNotification);
    };
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return { notifications, unreadCount, markAsRead };
}
```

### 4.2 Notification Bell Component

**File:** `apps/chat-web/src/components/NotificationBell.tsx`

```typescript
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div className="relative">
      <button className="p-2 hover:bg-gray-100 rounded">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown với danh sách notifications */}
    </div>
  );
}
```

---

## Checklist triển khai

### Phase 1: Frontend Extract Mentions
- [ ] 1.1 Thêm `getMentionedUserIds()` vào RichTextEditorRef
- [ ] 1.2 Update MessageComposer gọi và truyền mentionIds
- [ ] 1.3 Update ChatContext nhận mentionIds
- [ ] 1.4 Update socket.ts gửi mentionIds

### Phase 2: Backend Chat Service
- [ ] 2.1 Tạo/update SendMessageDto
- [ ] 2.2 Update chat.gateway.ts nhận mentionedUserIds
- [ ] 2.3 Implement sendMentionNotifications trong chat.service.ts
- [ ] 2.4 Config HttpModule để gọi notification service

### Phase 3: Backend Notification Service
- [ ] 3.1 Thêm CHAT_MENTION vào StoredNotificationType
- [ ] 3.2 Update/tạo SendNotificationDto
- [ ] 3.3 Implement handler trong notification.service.ts
- [ ] 3.4 Test WebSocket push notification

### Phase 4: Frontend Notifications UI
- [ ] 4.1 Tạo notification socket service
- [ ] 4.2 Tạo useNotifications hook
- [ ] 4.3 Tạo NotificationBell component
- [ ] 4.4 Integrate vào layout

---

## Testing

### Unit Tests
- Extract mention IDs từ HTML
- Filter self-mentions
- Notification creation

### Integration Tests
- End-to-end: Gửi message với mention → Nhận notification
- Multiple mentions trong 1 message
- Mention trong thread reply

### Manual Testing
1. User A mention User B
2. User B nhận real-time notification
3. Click notification → Navigate to message
4. Notification được lưu và hiển thị trong list

---

## Notes

- Notification service URL cần được config qua environment variable
- Cân nhắc rate limiting để tránh spam notifications
- Có thể mở rộng để support @channel, @here mentions sau này
