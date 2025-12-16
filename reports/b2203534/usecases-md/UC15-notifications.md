# UC15 - Quan ly thong bao

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC15 |
| **Ten** | Quan ly thong bao |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Don gian |
| **Actor** | Nguoi dung da dang nhap |

## Mo ta
Cho phep xem danh sach thong bao, cau hinh cai dat nhan thong bao va danh dau da doc.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong

## Chuc nang con

### A. Xem thong bao

```
[Nguoi dung] --> [Click icon thong bao] --> [Hien thi dropdown/page]
                                                   |
                                                   v
                                          [Danh sach thong bao]
                                          (Chua doc/Da doc)
```

### B. Danh dau da doc

```
[Nguoi dung] --> [Click thong bao] --> [Cap nhat trang thai]
                                              |
                                              v
                                      [Thong bao duoc danh dau da doc]
```

### C. Cau hinh thong bao

```
[Nguoi dung] --> [Settings > Notifications] --> [Hien thi form cau hinh]
                                                        |
                                                        v
                                               [Bat/tat cac loai thong bao]
                                                        |
                                                        v
                                               [Luu cau hinh]
```

### Cac buoc chi tiet

#### A. Xem thong bao
1. Click vao icon thong bao (co badge so chua doc)
2. He thong hien thi dropdown voi danh sach thong bao
3. Thong bao chua doc duoc highlight
4. Click "Xem tat ca" de vao trang chi tiet

#### B. Danh dau da doc
1. Click vao thong bao de xem chi tiet
2. Thong bao tu dong chuyen thanh da doc
3. Hoac click "Danh dau tat ca da doc"

#### C. Cau hinh thong bao
1. Vao Settings > Notifications
2. Bat/tat cac loai thong bao:
   - Email notifications
   - Push notifications
   - In-app notifications
3. Chon loai su kien muon nhan thong bao
4. Luu cau hinh

## Luong thay the (Alternative Flows)

### A.2a. Khong co thong bao
- Hien thi "Khong co thong bao moi"
- Hien thi icon empty state

## API Endpoints

### GET /api/notifications
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
unreadOnly: boolean (default: false)
workspaceId: uuid (optional)
page: number (default: 1)
limit: number (default: 20)
```

**Response Success (200):**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "MEMBER_INVITED",
      "title": "Ban duoc moi vao workspace",
      "content": "John Doe da moi ban tham gia workspace 'Project X'",
      "metadata": {
        "workspaceId": "uuid",
        "workspaceName": "Project X",
        "inviterId": "uuid"
      },
      "isRead": false,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "REPORT_CREATED",
      "title": "Bao cao moi duoc tao",
      "content": "Jane Doe da tao bao cao 'Monthly Summary' trong workspace 'Project X'",
      "metadata": {
        "workspaceId": "uuid",
        "reportId": "uuid",
        "reportName": "Monthly Summary"
      },
      "isRead": true,
      "createdAt": "2024-01-14T15:30:00Z"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### GET /api/notifications/unread-count
**Response Success (200):**
```json
{
  "count": 5
}
```

### PATCH /api/notifications/:id/read
**Response Success (200):**
```json
{
  "message": "Notification marked as read"
}
```

### PATCH /api/notifications/mark-all-read
**Request (optional):**
```json
{
  "workspaceId": "uuid"  // optional, mark all in specific workspace
}
```

**Response Success (200):**
```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

### GET /api/notifications/settings
**Response Success (200):**
```json
{
  "email": {
    "enabled": true,
    "events": {
      "memberInvited": true,
      "memberJoined": true,
      "memberRemoved": true,
      "reportCreated": true,
      "workspaceLocked": true,
      "ownershipTransferred": true
    }
  },
  "push": {
    "enabled": false,
    "events": {}
  },
  "inApp": {
    "enabled": true,
    "events": {
      "memberInvited": true,
      "memberJoined": true,
      "fileUploaded": true,
      "reportCreated": true
    }
  }
}
```

### PUT /api/notifications/settings
**Request:**
```json
{
  "email": {
    "enabled": true,
    "events": {
      "memberInvited": true,
      "memberJoined": false
    }
  },
  "push": {
    "enabled": true,
    "events": {
      "reportCreated": true
    }
  }
}
```

**Response Success (200):**
```json
{
  "message": "Notification settings updated"
}
```

## Database Schema

### Notification Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

### Notification Settings Table
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  email_events JSONB DEFAULT '{}',
  push_enabled BOOLEAN DEFAULT false,
  push_events JSONB DEFAULT '{}',
  in_app_enabled BOOLEAN DEFAULT true,
  in_app_events JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Notification Types
| Type | Description | Channels |
|------|-------------|----------|
| MEMBER_INVITED | Duoc moi vao workspace | Email, In-app |
| MEMBER_JOINED | Thanh vien moi tham gia | In-app |
| MEMBER_REMOVED | Bi xoa khoi workspace | Email, In-app |
| MEMBER_ROLE_CHANGED | Vai tro duoc thay doi | Email, In-app |
| OWNERSHIP_TRANSFERRED | Quyen so huu duoc chuyen | Email, In-app |
| OWNERSHIP_RECEIVED | Nhan quyen so huu | Email, In-app |
| WORKSPACE_LOCKED | Workspace bi khoa | Email, In-app |
| WORKSPACE_UNLOCKED | Workspace duoc mo khoa | Email, In-app |
| FILE_UPLOADED | File moi duoc upload | In-app |
| REPORT_CREATED | Bao cao moi duoc tao | In-app |

## Implementation Notes

### Notification Service
```typescript
async function createNotification(data: {
  userId: string;
  workspaceId?: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  // Check user settings
  const settings = await getNotificationSettings(data.userId);

  // Create in-app notification if enabled
  if (settings.inAppEnabled && settings.inAppEvents[data.type] !== false) {
    await db.notifications.create({
      data: {
        userId: data.userId,
        workspaceId: data.workspaceId,
        type: data.type,
        title: data.title,
        content: data.content,
        metadata: data.metadata
      }
    });

    // Emit real-time event
    socketService.emit(data.userId, 'notification', {
      type: data.type,
      title: data.title,
      content: data.content
    });
  }

  // Send email if enabled
  if (settings.emailEnabled && settings.emailEvents[data.type] !== false) {
    const user = await db.users.findUnique({ where: { id: data.userId } });
    await emailService.send({
      to: user.email,
      template: `notification-${data.type.toLowerCase()}`,
      data: {
        userName: user.firstName,
        ...data.metadata
      }
    });
  }

  // Send push notification if enabled
  if (settings.pushEnabled && settings.pushEvents[data.type] !== false) {
    await pushService.send({
      userId: data.userId,
      title: data.title,
      body: data.content,
      data: data.metadata
    });
  }
}

async function getUnreadCount(userId: string): Promise<number> {
  return db.notifications.count({
    where: { userId, isRead: false }
  });
}

async function markAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  await db.notifications.update({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() }
  });
}

async function markAllAsRead(
  userId: string,
  workspaceId?: string
): Promise<number> {
  const where: Prisma.NotificationWhereInput = {
    userId,
    isRead: false
  };

  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  const result = await db.notifications.updateMany({
    where,
    data: { isRead: true, readAt: new Date() }
  });

  return result.count;
}
```

### Real-time Notifications (Socket.IO)
```typescript
// Server
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;

  // Join user's room
  socket.join(`user:${userId}`);

  socket.on('disconnect', () => {
    socket.leave(`user:${userId}`);
  });
});

// Emit notification
function emitNotification(userId: string, notification: Notification) {
  io.to(`user:${userId}`).emit('notification', notification);
}

// Client
socket.on('notification', (data) => {
  // Update badge count
  updateBadgeCount(prev => prev + 1);

  // Show toast
  showToast(data.title, data.content);
});
```

## UI Components

### Notification Dropdown
```typescript
interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onViewAll: () => void;
}
```

### Notification Item
```typescript
interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

// Styling
const notificationStyles = {
  unread: 'bg-blue-50 border-l-4 border-blue-500',
  read: 'bg-white'
};
```

## Audit Log
- Action: `NOTIFICATION_SETTINGS_UPDATED`
