# Backend Integration Checklist - Project-Specific Chat

## ✅ Checklist cho Backend Team

### 1. **API Endpoint: POST /chat/rooms/channel**

#### Request Payload:
```json
{
  "name": "channel-name",
  "is_private": false,
  "project_id": "abc-123" // hoặc null cho org-level
}
```

#### ⚠️ QUAN TRỌNG - Response phải bao gồm `projectId`:
```json
{
  "id": "room-uuid",
  "name": "channel-name",
  "orgId": "org-123",
  "isPrivate": false,
  "type": "channel",
  "projectId": "abc-123"  // ← PHẢI TRẢ VỀ FIELD NÀY!
}
```

**Lưu ý:**
- Nếu request có `project_id` → response phải có `projectId` với giá trị tương ứng
- Nếu request có `project_id = null` → response có `projectId = null` hoặc không có field
- Field name mapping: `project_id` (snake_case) → `projectId` (camelCase)

---

### 2. **API Endpoint: GET /chat/rooms**

#### Request Query Params:
```
GET /chat/rooms?limit=50&project_id=abc-123
```

**Behavior:**
- `project_id` không có → trả VỀ TẤT CẢ rooms (org + project + DM)
- `project_id=""` → chỉ trả về org-level rooms + DMs
- `project_id="abc-123"` → chỉ trả về rooms của project abc-123

#### Response:
```json
{
  "items": [
    {
      "id": "room-1",
      "name": "general",
      "orgId": "org-123",
      "isPrivate": false,
      "type": "channel",
      "projectId": null  // org-level channel
    },
    {
      "id": "room-2",
      "name": "dev-team",
      "orgId": "org-123",
      "isPrivate": false,
      "type": "channel",
      "projectId": "abc-123"  // project-specific channel
    }
  ],
  "pagingState": null
}
```

---

### 3. **API Endpoint: GET /chat/rooms/browse**

#### Request Query Params:
```
GET /chat/rooms/browse?limit=100&project_id=abc-123
```

**Same behavior as GET /chat/rooms**

---

## 🧪 Testing Scenarios

### Scenario 1: Tạo Org-Level Channel
```bash
# Request
POST /chat/rooms/channel
{
  "name": "general",
  "is_private": false,
  "project_id": null
}

# Expected Response
{
  "id": "room-xxx",
  "name": "general",
  "projectId": null  # hoặc không có field
}
```

### Scenario 2: Tạo Project Channel
```bash
# Request
POST /chat/rooms/channel
{
  "name": "project-dev",
  "is_private": false,
  "project_id": "abc-123"
}

# Expected Response
{
  "id": "room-yyy",
  "name": "project-dev",
  "projectId": "abc-123"  # ← PHẢI KHỚP
}
```

### Scenario 3: List Rooms - Org Level
```bash
# User ở org-level, frontend gọi:
GET /chat/rooms?limit=50
# Không có project_id param

# Expected: Trả về TẤT CẢ rooms user đã join
```

### Scenario 4: List Rooms - Project Level
```bash
# User ở /project/abc-123, frontend gọi:
GET /chat/rooms?limit=50
# Không có project_id param (frontend load all để filter)

# Expected: Trả về TẤT CẢ rooms, frontend sẽ filter
```

---

## 🐛 Debug Logs

Frontend đã thêm comprehensive logging:

```javascript
// Khi tạo channel, check console:
[ChatContext] Creating channel with projectId: abc-123
[API] Creating channel with payload: { name: "test", is_private: false, project_id: "abc-123" }
[API] Channel created, response: { id: "...", projectId: "abc-123" }
[ChatContext] Channel created response: { ... }
[ChatContext] Adding new room to list: { ..., projectId: "abc-123" }
```

**Warning nếu backend trả sai:**
```
[ChatContext] Backend returned different projectId!
{ expected: "abc-123", received: null }
```

---

## ✅ Verification Steps

1. **Mở browser console**
2. **Navigate to `/project/abc-123`**
3. **Click "Create Channel"**
4. **Check logs:**
   - ✅ Request payload có `project_id: "abc-123"`
   - ✅ Response có `projectId: "abc-123"`
   - ✅ Không có warning log
5. **Verify UI:**
   - ✅ Channel xuất hiện trong "Project Channels" section
   - ❌ Không xuất hiện trong "Organization Channels"

---

## 📝 Database Schema (Reference)

Backend cần đảm bảo `rooms` table có column:

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  project_id UUID,  -- ← NULLABLE, null = org-level
  name VARCHAR(255),
  is_private BOOLEAN,
  type VARCHAR(50),
  created_at TIMESTAMP,
  ...
);
```

---

## 🔗 Related Files

- Frontend API: `apps/chat-web/src/services/api.ts`
- Frontend Context: `apps/chat-web/src/contexts/ChatContext.tsx`
- Frontend Types: `apps/chat-web/src/types/index.ts`
