# Chat API - Separate Endpoints Design

## Tổng quan

Thiết kế lại API để tách biệt 3 loại rooms: **Org Channels**, **Project Channels**, và **DMs**.

---

## 🎯 Requirements

### Khi user ở trong **project context**:
Frontend gọi **3 API** song song:
1. `GET /rooms/org-channels` - Org-level channels
2. `GET /rooms/project-channels?projectId=xxx` - Project-specific channels
3. `GET /rooms/dms` - Direct messages

### Khi user ở **org context** (không có project):
Frontend gọi **2 API** song song:
1. `GET /rooms/org-channels` - Org-level channels
2. `GET /rooms/dms` - Direct messages

---

## 📡 API Endpoints

### Browse Endpoints

#### **GET /rooms/browse/org**

Browse PUBLIC org-level channels (for "Browse Channels" modal)

**Query Parameters:**
- `limit` (optional): Number of rooms to return

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "general",
      "orgId": "uuid",
      "isPrivate": false,
      "type": "channel",
      "projectId": null
    }
  ],
  "pagingState": null
}
```

**Backend Implementation:**
```typescript
// Query rooms table, filter: isPrivate = false AND projectId = null
const allRooms = await this.roomsRepo.listByOrg(orgId);
const publicOrgChannels = allRooms.filter(r =>
  !r.isPrivate && r.type === 'channel' && !r.projectId
);
```

---

#### **GET /rooms/browse/project?projectId=xxx**

Browse PUBLIC project-specific channels

**Query Parameters:**
- `projectId` (required): Project UUID
- `limit` (optional): Number of rooms to return

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "project-alpha-dev",
      "orgId": "uuid",
      "isPrivate": false,
      "type": "channel",
      "projectId": "project-uuid"
    }
  ],
  "pagingState": null
}
```

---

### Joined Rooms Endpoints

#### 1. **GET /rooms/org-channels**

List org-level channels (channels không thuộc project nào)

**Query Parameters:**
- `limit` (optional): Number of rooms to return

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "general",
      "orgId": "uuid",
      "isPrivate": false,
      "type": "channel",
      "projectId": null
    }
  ],
  "pagingState": null
}
```

**Backend Implementation:**
```typescript
// Query user_rooms table
// Filter: roomType = 'channel' AND projectId = null
const result = await this.roomsRepo.listJoinedRoomsByUser(userId, orgId);
const orgChannels = result.items.filter(ur =>
  ur.roomType === 'channel' && (ur.projectId === null || ur.projectId === undefined)
);
```

---

### 2. **GET /rooms/project-channels?projectId=xxx**

List project-specific channels

**Query Parameters:**
- `projectId` (required): Project UUID
- `limit` (optional): Number of rooms to return

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "project-alpha-dev",
      "orgId": "uuid",
      "isPrivate": false,
      "type": "channel",
      "projectId": "project-uuid"
    }
  ],
  "pagingState": null
}
```

**Backend Implementation:**
```typescript
// Query user_project_rooms table directly
// Uses composite partition key: (user_id, org_id, project_id)
const result = await this.roomsRepo.listJoinedRoomsByUserAndProject(
  userId,
  orgId,
  projectId
);
```

**Performance:** ⚡ Direct partition read (no filtering needed)

---

### 3. **GET /rooms/dms**

List all DMs for user

**Query Parameters:**
- `limit` (optional): Number of DMs to return

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "John Doe, Jane Smith",
      "orgId": "uuid",
      "isPrivate": true,
      "type": "dm",
      "projectId": null
    }
  ],
  "pagingState": null
}
```

**Backend Implementation:**
```typescript
// Query user_dms table directly
// Uses partition key: (user_id, org_id)
const result = await this.roomsRepo.listDmsByUser(userId, orgId);
```

**Performance:** ⚡ Direct partition read

---

## 💻 Frontend Implementation

### ChatContext.tsx

#### Loading Joined Rooms

```typescript
const loadRooms = async () => {
  let allRooms: Room[] = [];

  if (currentProjectId) {
    // Project context: 3 API calls
    const [orgChannels, projectChannels, dms] = await Promise.all([
      api.listOrgChannels(50),
      api.listProjectChannels(currentProjectId, 50),
      api.listDms(50),
    ]);

    allRooms = [
      ...orgChannels.items,
      ...projectChannels.items,
      ...dms.items,
    ];
  } else {
    // Org context: 2 API calls
    const [orgChannels, dms] = await Promise.all([
      api.listOrgChannels(50),
      api.listDms(50),
    ]);

    allRooms = [
      ...orgChannels.items,
      ...dms.items,
    ];
  }

  setRooms(allRooms);
};
```

#### Browsing Public Rooms

```typescript
const handleBrowsePublicRooms = async (): Promise<Room[]> => {
  if (currentProjectId) {
    // In project: show org + project public channels
    const [orgRooms, projectRooms] = await Promise.all([
      api.browseOrgPublicRooms(100),
      api.browseProjectPublicRooms(currentProjectId, 100),
    ]);
    return [...orgRooms.items, ...projectRooms.items];
  } else {
    // In org: show only org public channels
    const result = await api.browseOrgPublicRooms(100);
    return result.items;
  }
};
```

### API Service

```typescript
// apps/chat-web/src/services/api.ts

// Joined rooms
async listOrgChannels(limit?: number): Promise<{ items: Room[] }> {
  const response = await fetch(`${this.baseURL}/rooms/org-channels?limit=${limit}`);
  return response.json();
}

async listProjectChannels(projectId: string, limit?: number): Promise<{ items: Room[] }> {
  const response = await fetch(
    `${this.baseURL}/rooms/project-channels?projectId=${projectId}&limit=${limit}`
  );
  return response.json();
}

async listDms(limit?: number): Promise<{ items: Room[] }> {
  const response = await fetch(`${this.baseURL}/rooms/dms?limit=${limit}`);
  return response.json();
}

// Browse public rooms
async browseOrgPublicRooms(limit?: number): Promise<{ items: Room[] }> {
  const response = await fetch(`${this.baseURL}/rooms/browse/org?limit=${limit}`);
  return response.json();
}

async browseProjectPublicRooms(projectId: string, limit?: number): Promise<{ items: Room[] }> {
  const response = await fetch(
    `${this.baseURL}/rooms/browse/project?projectId=${projectId}&limit=${limit}`
  );
  return response.json();
}
```

---

## 📊 Database Queries

### Query Optimization Table

| Endpoint | Table Used | Partition Key | Filter Needed | Performance |
|----------|-----------|---------------|---------------|-------------|
| `/org-channels` | `user_rooms` | `(user_id, org_id)` | Application filter `projectId = null` | ⚡ Fast |
| `/project-channels` | `user_project_rooms` | `(user_id, org_id, project_id)` | None | ⚡⚡ Fastest |
| `/dms` | `user_dms` | `(user_id, org_id)` | None | ⚡⚡ Fastest |

---

## 🔄 Data Flow

### Project Context:

```
User opens project page
  ↓
Frontend calls 3 APIs in parallel:
  - GET /rooms/org-channels
  - GET /rooms/project-channels?projectId=xxx
  - GET /rooms/dms
  ↓
Backend queries:
  - user_rooms (filter projectId = null)
  - user_project_rooms (direct query)
  - user_dms (direct query)
  ↓
Frontend merges results:
  [org channels, project channels, DMs]
  ↓
Sidebar displays all rooms
```

### Org Context:

```
User on org page (no project selected)
  ↓
Frontend calls 2 APIs in parallel:
  - GET /rooms/org-channels
  - GET /rooms/dms
  ↓
Backend queries:
  - user_rooms (filter projectId = null)
  - user_dms (direct query)
  ↓
Frontend merges results:
  [org channels, DMs]
  ↓
Sidebar displays org-level rooms
```

---

## 🎨 UI Structure

```
Sidebar
├── Org Channels (always visible)
│   ├── #general
│   ├── #random
│   └── ...
│
├── Project Channels (only when in project context)
│   ├── #project-alpha-dev
│   ├── #project-alpha-design
│   └── ...
│
└── Direct Messages (always visible)
    ├── John Doe
    ├── Jane Smith, Bob Johnson
    └── ...
```

---

## ⚡ Performance Benefits

### Before (Single API call):
```
GET /rooms?projectId=xxx
  ↓
Query user_rooms (all rooms)
  ↓
Backend filters by projectId
  ↓
Return filtered rooms
```
**Problem:** Returns ALL rooms then filters

### After (Separate APIs):
```
GET /rooms/org-channels
GET /rooms/project-channels?projectId=xxx
GET /rooms/dms
  ↓
3 optimized queries in parallel
  ↓
Each query targets specific table
```

**Benefits:**
- ✅ Parallel queries (faster overall)
- ✅ Smaller response payloads
- ✅ Better cache utilization
- ✅ Clear separation of concerns

---

## 🧪 Testing Scenarios

### Test 1: Org Context
```bash
# Should return org channels + DMs only
curl GET /rooms/org-channels
curl GET /rooms/dms
```

**Expected:**
- Org channels: Channels without projectId
- DMs: All DMs for user

### Test 2: Project Context
```bash
# Should return org + project channels + DMs
curl GET /rooms/org-channels
curl GET /rooms/project-channels?projectId=xxx
curl GET /rooms/dms
```

**Expected:**
- Org channels: Channels without projectId
- Project channels: Channels with matching projectId
- DMs: All DMs for user

### Test 3: Empty Results
```bash
# New user with no rooms
curl GET /rooms/org-channels  # []
curl GET /rooms/dms           # []
```

---

## 📝 Migration Notes

### Backward Compatibility

Old endpoint `GET /rooms?projectId=xxx` is **DEPRECATED** but still works:
- Without projectId → Returns org-level channels only (no DMs)
- With projectId → Returns project channels only

**Migration Path:**
1. ✅ Add new endpoints
2. ✅ Update frontend to use new endpoints
3. ⏳ Monitor usage of old endpoint
4. ⏳ Remove old endpoint after migration

---

## 🔗 Related Files

### Backend:
- [rooms.controller.ts:92-136](services/chat/src/rooms/rooms.controller.ts) - New endpoints
- [rooms.service.ts:271-330](services/chat/src/rooms/rooms.service.ts) - Service methods

### Frontend:
- [api.ts:90-168](apps/chat-web/src/services/api.ts) - API client
- [ChatContext.tsx:253-297](apps/chat-web/src/contexts/ChatContext.tsx) - loadRooms implementation

---

## 📈 Metrics to Monitor

1. **API Response Times:**
   - `/org-channels`: < 50ms
   - `/project-channels`: < 50ms
   - `/dms`: < 50ms

2. **Parallel Request Completion:**
   - Total time for 3 APIs: < 100ms (parallel)
   - vs Old single API: 50-200ms

3. **Data Transfer:**
   - Avg payload size per endpoint: ~5-10KB
   - Total: ~15-30KB (vs 50-100KB for single endpoint)

---

## ✅ Summary

| Aspect | Before | After |
|--------|--------|-------|
| API calls | 1 | 2-3 (parallel) |
| Backend filtering | Yes | Minimal |
| Query performance | Medium | Fast |
| Code clarity | Mixed concerns | Separated |
| Frontend complexity | Simple | Slightly more |
| Overall performance | Medium | **Better** |
