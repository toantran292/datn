# Migration Guide: Add Project ID Support

## Overview
This migration adds `project_id` column to the `rooms` table to support project-specific chat channels.

## Migration File
**File:** `db/migrations/002_add_project_id.cql`

## Steps to Apply Migration

### 1. Connect to Cassandra
```bash
# Using Docker
docker exec -it cassandra-chat cqlsh

# Or local cqlsh
cqlsh localhost 9042
```

### 2. Apply Migration
```sql
-- Add project_id column to rooms table
ALTER TABLE chat.rooms ADD project_id uuid;
```

### 3. Verify Migration
```sql
-- Check schema
DESCRIBE TABLE chat.rooms;

-- Should see:
-- project_id uuid
```

### 4. Test Query
```sql
-- List all rooms with project_id
SELECT org_id, id, name, type, project_id FROM chat.rooms LIMIT 10;

-- Existing rooms will have project_id = null (org-level)
```

## Rollback (if needed)
```sql
-- Cassandra doesn't support DROP COLUMN natively
-- You would need to:
-- 1. Create new table without project_id
-- 2. Copy data
-- 3. Drop old table
-- 4. Rename new table

-- NOT RECOMMENDED - better to keep column as it's nullable
```

## Backend Changes Applied

### 1. **RoomEntity Interface**
```typescript
export interface RoomEntity {
  projectId?: types.Uuid | null;
}
```

### 2. **Repository**
- `create()` - accepts `projectId` parameter
- `listByOrg()` - includes `project_id` in SELECT

### 3. **Service**
- `createChannel()` - accepts `projectId` parameter
- Passes `projectId` to repository

### 4. **Controller**
```typescript
@Post('channel')
async createChannel(
  @Body('project_id') projectId?: string | null,
) {
  const projectUuid = projectId ? types.Uuid.fromString(projectId) : null;
  const room = await this.roomsService.createChannel(
    name, isPrivate, ctx.orgId, ctx.userId, projectUuid
  );
  return {
    projectId: room.projectId?.toString() || null, // ← Returns to frontend
  };
}
```

### 5. **Response DTO**
```typescript
export class RoomResponseDto {
  @Expose() projectId: string | null;
}
```

### 6. **WebSocket**
- `RoomSummaryPayload` includes `projectId`
- `rooms:bootstrap` event includes `projectId`

## Testing

### 1. Create Org-Level Channel
```bash
curl -X POST http://localhost:8080/chat/rooms/channel \
  -H "Content-Type: application/json" \
  -d '{
    "name": "general",
    "is_private": false,
    "project_id": null
  }'

# Expected Response:
{
  "id": "...",
  "name": "general",
  "projectId": null  # ← Org-level
}
```

### 2. Create Project Channel
```bash
curl -X POST http://localhost:8080/chat/rooms/channel \
  -H "Content-Type: application/json" \
  -d '{
    "name": "project-dev",
    "is_private": false,
    "project_id": "550e8400-e29b-41d4-a716-446655440000"
  }'

# Expected Response:
{
  "id": "...",
  "name": "project-dev",
  "projectId": "550e8400-e29b-41d4-a716-446655440000"  # ← Project-specific
}
```

### 3. List Rooms
```bash
curl http://localhost:8080/chat/rooms

# Expected: Both org and project channels with projectId field
```

## Database Verification

```sql
-- Check data after creating channels
SELECT
  id,
  org_id,
  name,
  type,
  project_id,
  is_private
FROM chat.rooms
WHERE org_id = <your-org-id>
LIMIT 20;

-- Org-level: project_id = null
-- Project-specific: project_id = <uuid>
```

## Notes

- **Backward Compatibility**: Existing rooms automatically have `project_id = null` (org-level)
- **Frontend**: Already updated to send/receive `projectId`
- **WebSocket**: Broadcasts include `projectId` field
- **Nullable**: Column is nullable, so no data migration needed

## Troubleshooting

### Migration fails
```bash
# Check if column already exists
DESCRIBE TABLE chat.rooms;

# If exists, migration already applied
```

### Old data missing projectId
```bash
# This is expected and correct
# Existing rooms are org-level (project_id = null)
```

### Frontend not receiving projectId
```bash
# Check backend logs
# Verify DTO includes @Expose() projectId
# Check network response in browser DevTools
```
