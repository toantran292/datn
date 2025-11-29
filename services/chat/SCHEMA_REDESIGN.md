# Cassandra Schema Redesign for Chat Service

## Mục tiêu

Tối ưu hóa schema Cassandra để hỗ trợ các query patterns sau một cách hiệu quả:

1. **Lấy rooms theo org**: `listByOrg(orgId)`
2. **Lấy joined rooms của user theo org**: `listJoinedRoomsByUser(userId, orgId)`
3. **Lấy joined rooms của user theo org + project**: `listJoinedRoomsByUserAndProject(userId, orgId, projectId)`
4. **Lấy DMs của user theo org**: `listDmsByUser(userId, orgId)`

## Vấn đề với Schema cũ

### 1. Bảng `rooms`
```cql
PRIMARY KEY ((org_id), id)
```
- ✅ Query theo `org_id` OK
- ❌ Không thể filter theo `type` hay `project_id` hiệu quả

### 2. Bảng `room_members`
```cql
PRIMARY KEY ((room_id), user_id)
```
- ✅ Query members của room OK
- ❌ Query rooms của user cần `ALLOW FILTERING` → RẤT CHẬM, không scalable

```cql
-- Query cũ - CHẬM!
SELECT room_id FROM room_members
WHERE org_id = ? AND user_id = ?
ALLOW FILTERING
```

## Giải pháp: Denormalization

Cassandra được thiết kế cho **denormalization** - lưu trữ data nhiều lần để tối ưu cho từng query pattern.

### Trade-off:
- ✅ **Reads**: Cực nhanh, không cần ALLOW FILTERING
- ❌ **Writes**: Nhiều hơn (batch writes vào nhiều bảng)
- ❌ **Storage**: Tăng (acceptable vì storage rẻ)

## Schema Mới

### 1. `rooms` - Giữ nguyên
```cql
CREATE TABLE chat.rooms (
  id          timeuuid,
  org_id      uuid,
  is_private  boolean,
  name        text,
  type        text,
  project_id  uuid,
  PRIMARY KEY ((org_id), id)
) WITH CLUSTERING ORDER BY (id DESC);
```
**Use case**: Lookup room details, list all rooms in org

---

### 2. `room_members` - Giữ nguyên
```cql
CREATE TABLE chat.room_members (
  room_id     timeuuid,
  user_id     uuid,
  org_id      uuid,
  last_seen_message_id timeuuid,
  PRIMARY KEY ((room_id), user_id)
);
```
**Use case**: Check membership, list members of a room

---

### 3. `user_rooms` - MỚI ⭐
```cql
CREATE TABLE chat.user_rooms (
  user_id     uuid,
  org_id      uuid,
  room_id     timeuuid,
  room_type   text,
  room_name   text,
  is_private  boolean,
  project_id  uuid,
  joined_at   timestamp,
  last_seen_message_id timeuuid,
  PRIMARY KEY ((user_id, org_id), room_id)
) WITH CLUSTERING ORDER BY (room_id DESC);
```

**Use case**: Query `listJoinedRoomsByUser(userId, orgId)`
- Partition key: `(user_id, org_id)` → 1 partition cho tất cả rooms của user trong org
- Fast lookup, không cần ALLOW FILTERING

---

### 4. `user_project_rooms` - MỚI ⭐
```cql
CREATE TABLE chat.user_project_rooms (
  user_id     uuid,
  org_id      uuid,
  project_id  uuid,
  room_id     timeuuid,
  room_type   text,
  room_name   text,
  is_private  boolean,
  joined_at   timestamp,
  last_seen_message_id timeuuid,
  PRIMARY KEY ((user_id, org_id, project_id), room_id)
) WITH CLUSTERING ORDER BY (room_id DESC);
```

**Use case**: Query `listJoinedRoomsByUserAndProject(userId, orgId, projectId)`
- Partition key: `(user_id, org_id, project_id)` → rooms của user trong project cụ thể
- Fast lookup cho project-specific channels

---

### 5. `user_dms` - MỚI ⭐
```cql
CREATE TABLE chat.user_dms (
  user_id     uuid,
  org_id      uuid,
  room_id     timeuuid,
  room_name   text,
  joined_at   timestamp,
  last_seen_message_id timeuuid,
  PRIMARY KEY ((user_id, org_id), room_id)
) WITH CLUSTERING ORDER BY (room_id DESC);
```

**Use case**: Query `listDmsByUser(userId, orgId)`
- Chỉ chứa DMs (type = 'dm')
- Fast lookup cho direct messages

## Data Consistency Strategy

### Khi user JOIN room:

**Batch write** vào nhiều bảng:

```typescript
async addMember(roomId, userId, orgId, roomData) {
  const queries = [
    // 1. Main membership table
    { query: 'INSERT INTO room_members ...', params: [...] },

    // 2. User rooms lookup
    { query: 'INSERT INTO user_rooms ...', params: [...] },

    // 3. Project-specific (if projectId != null)
    { query: 'INSERT INTO user_project_rooms ...', params: [...] },

    // 4. DMs lookup (if type = 'dm')
    { query: 'INSERT INTO user_dms ...', params: [...] },
  ];

  await client.batch(queries, { prepare: true });
}
```

### Khi update `last_seen_message_id`:

**Batch update** vào các bảng tương ứng:

```typescript
async updateLastSeenWithRoomInfo(roomId, userId, lastId, orgId, roomType, projectId) {
  const queries = [
    // 1. Main table
    { query: 'UPDATE room_members SET last_seen_message_id = ? WHERE ...', params: [...] },

    // 2. User rooms
    { query: 'UPDATE user_rooms SET last_seen_message_id = ? WHERE ...', params: [...] },

    // 3. Project-specific (if applicable)
    { query: 'UPDATE user_project_rooms SET last_seen_message_id = ? WHERE ...', params: [...] },

    // 4. DMs (if type = 'dm')
    { query: 'UPDATE user_dms SET last_seen_message_id = ? WHERE ...', params: [...] },
  ];

  await client.batch(queries, { prepare: true });
}
```

## Query Performance Comparison

| Query | Old Schema | New Schema |
|-------|-----------|------------|
| Get joined rooms by user+org | `ALLOW FILTERING` 🐌 | Direct partition read ⚡ |
| Get joined rooms by user+org+project | Not supported | Direct partition read ⚡ |
| Get DMs by user+org | `ALLOW FILTERING` 🐌 | Direct partition read ⚡ |
| Get rooms by org | Direct read ⚡ | No change ⚡ |

## Migration Path

1. ✅ Tạo migration file: `003_optimize_query_patterns.cql`
2. ✅ Update repositories với new methods
3. ✅ Update service layer để sử dụng new queries
4. ⚠️ **TODO**: Chạy migration trên production
5. ⚠️ **TODO**: Backfill data từ `room_members` vào các bảng mới

### Backfill Script (cần implement):

```typescript
// Pseudo-code
async function backfillUserRoomsTables() {
  // 1. Scan all room_members
  // 2. For each member, get room details from rooms table
  // 3. Insert into user_rooms, user_project_rooms, user_dms accordingly
}
```

## Files Changed

1. `/services/chat/db/migrations/003_optimize_query_patterns.cql` - New tables
2. `/services/chat/src/rooms/repositories/room.repository.ts` - New query methods
3. `/services/chat/src/rooms/repositories/room-members.repository.ts` - Batch writes
4. `/services/chat/src/rooms/rooms.service.ts` - Use new queries
5. `/services/chat/src/chat/chat.gateway.ts` - Update method signatures

## Best Practices Applied

✅ **Query-driven design**: Thiết kế schema dựa trên query patterns
✅ **Denormalization**: Accept duplicate data để tối ưu reads
✅ **Batch operations**: Ensure consistency khi write vào nhiều bảng
✅ **Composite partition keys**: Distribute data evenly, avoid hot partitions
✅ **Clustering keys**: Sort data trong partition (DESC by room_id)

## Notes

- Cassandra là AP system (not CP), eventual consistency là OK
- Batch writes là atomic trong same partition, best-effort cross-partition
- Monitor partition sizes để tránh large partitions (>100MB)
- Consider TTL nếu cần auto-cleanup old data
