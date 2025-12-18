# Seed Data Guide for DATN Project

## Overview

This guide documents all seed files and their relationship with service schemas. **When you modify any schema in a service, you MUST update the corresponding seed file to maintain compatibility.**

## Directory Structure

```
scripts/seeds/
├── SEED_GUIDE.md          # This file - documentation
├── seed-constants.ts      # Shared constants (IDs, dates, etc.)
├── seed-users.ts          # Identity service - users
├── seed-organizations.ts  # Identity service - organizations, memberships
├── seed-projects.ts       # PM service - projects, sprints, statuses
├── seed-issues.ts         # PM service - issues, comments, activities
├── seed-chat.ts           # Chat service - rooms, messages, reactions
├── seed-chat-with-video.ts # Chat + Meeting - messages with video attachments
├── seed-files.ts          # File-storage service - file metadata
├── seed-notifications.ts  # Notification service - notifications
├── seed-reports.ts        # Tenant-BFF - reports
└── seed-all.ts            # Master script to run all seeds
```

## Schema to Seed File Mapping

### 1. Identity Service (PostgreSQL - Flyway)

| Schema File | Seed File | Tables |
|------------|-----------|--------|
| `services/identity/src/main/resources/db/migration/V1__init.sql` | `seed-users.ts`, `seed-organizations.ts` | `users`, `organizations`, `memberships`, `roles`, `role_bindings`, `invitations` |

**Key Fields to Watch:**
- `users`: id, email, password_hash, display_name, phone, avatar_asset_id
- `organizations`: id, slug, display_name, llm_provider, settings, status
- `memberships`: user_id, org_id, roles[], member_type

### 2. PM Service (PostgreSQL - Prisma)

| Schema File | Seed File | Tables |
|------------|-----------|--------|
| `services/pm/prisma/schema.prisma` | `seed-projects.ts`, `seed-issues.ts` | `project`, `sprint`, `issue`, `issue_status`, `issue_comment`, `issue_activity`, `project_member` |

**Key Fields to Watch:**
- `project`: id, orgId, identifier, name, projectLead, defaultAssignee
- `sprint`: id, projectId, name, status (FUTURE/ACTIVE/CLOSED), startDate, endDate
- `issue`: id, projectId, sprintId, statusId, name, priority, type, point, assigneesJson, createdBy
- `issue_status`: id, projectId, name, color, order

### 3. Chat Service (PostgreSQL - TypeORM)

| Schema File | Seed File | Tables |
|------------|-----------|--------|
| `services/chat/src/database/entities/*.ts` | `seed-chat.ts`, `seed-chat-with-video.ts` | `rooms`, `messages`, `room_members`, `message_reactions`, `message_attachments`, `pinned_messages`, `channel_ai_configs` |

**Key Fields to Watch:**
- `rooms`: id, org_id, project_id, name, type (channel/dm), is_private, status
- `messages`: id, room_id, user_id, org_id, thread_id, content, type (text/file/system/huddle_started/huddle_ended), format, metadata
- `message_attachments`: id, message_id, file_id, file_name, file_size, mime_type

### 4. Meeting Service (PostgreSQL - Prisma)

| Schema File | Seed File | Tables |
|------------|-----------|--------|
| `services/meeting/signaling/prisma/schema.prisma` | `seed-chat-with-video.ts` | `Meeting`, `Participant`, `Recording`, `MeetingEvent`, `Transcript` |

**Key Fields to Watch:**
- `Meeting`: id, roomId, subjectType, subjectId, hostUserId, orgId, status
- `Recording`: id, meetingId, status, s3Url, duration, fileSize

### 5. File-Storage Service (MongoDB - Mongoose)

| Schema File | Seed File | Collection |
|------------|-----------|------------|
| `services/file-storage/src/metadata/schemas/file-metadata.schema.ts` | `seed-files.ts` | `file_metadata` |
| `services/file-storage/src/metadata/schemas/folder.schema.ts` | `seed-files.ts` | `folders` |

**Key Fields to Watch:**
- `file_metadata`: originalName, mimeType, size, bucket, objectKey, service, modelType, subjectId, uploadedBy, orgId, workspaceId, folderId, uploadStatus

### 6. Notification Service (PostgreSQL - TypeORM)

| Schema File | Seed File | Tables |
|------------|-----------|--------|
| `services/notification/src/persistence/entities/notification.entity.ts` | `seed-notifications.ts` | `notifications` |

**Key Fields to Watch:**
- `notifications`: id, userId, orgId, type, title, content, metadata, isRead

### 7. Tenant-BFF Service (MongoDB)

| Schema File | Seed File | Collection |
|------------|-----------|------------|
| N/A (defined in seed) | `seed-reports.ts` | `reports` |

## How to Update Seeds When Schema Changes

### Step 1: Identify the Schema Change

When you modify a schema file (e.g., add a new column, change data type, add new enum value):

1. Note the exact change made
2. Identify which seed file(s) need updating
3. Check if the change affects seed-constants.ts

### Step 2: Update the Seed File

#### Adding a New Required Field

```typescript
// Before (schema change: added 'priority' required field to project)
const project = {
  id: CONSTANTS.PROJECT_IDS.PROJECT_1,
  name: 'Project Alpha',
  orgId: CONSTANTS.ORG_IDS.ACME,
};

// After
const project = {
  id: CONSTANTS.PROJECT_IDS.PROJECT_1,
  name: 'Project Alpha',
  orgId: CONSTANTS.ORG_IDS.ACME,
  priority: 'high', // NEW REQUIRED FIELD
};
```

#### Adding a New Enum Value

```typescript
// If you add a new status enum value to issue_status
// Update seed-constants.ts:
export const ISSUE_STATUS = {
  TODO: 'TO DO',
  IN_PROGRESS: 'IN PROGRESS',
  IN_REVIEW: 'IN REVIEW',
  DONE: 'DONE',
  BLOCKED: 'BLOCKED', // NEW ENUM VALUE
} as const;

// Then update seed-issues.ts to include issues with the new status
```

#### Changing Field Type

```typescript
// If you change assignees from string[] to JSONB
// Before:
assignees: ['user-id-1', 'user-id-2'],

// After:
assigneesJson: JSON.stringify([
  { userId: 'user-id-1', role: 'assignee' },
  { userId: 'user-id-2', role: 'reviewer' },
]),
```

### Step 3: Test the Seed

```bash
# Clear existing data
npm run seed:clear

# Run the updated seed
npm run seed

# Or run specific seed
npx tsx scripts/seeds/seed-projects.ts
```

### Step 4: Update This Guide

Add any new fields or tables to the appropriate section in this guide.

## Seed Execution Order

Seeds must be run in this order due to foreign key dependencies:

1. `seed-users.ts` - Creates users first
2. `seed-organizations.ts` - Creates orgs and memberships (depends on users)
3. `seed-projects.ts` - Creates projects and sprints (depends on orgs)
4. `seed-issues.ts` - Creates issues (depends on projects, users)
5. `seed-chat.ts` - Creates rooms and messages (depends on orgs, users)
6. `seed-chat-with-video.ts` - Adds video messages (depends on chat)
7. `seed-files.ts` - Creates file metadata (depends on orgs, users)
8. `seed-notifications.ts` - Creates notifications (depends on users, orgs)
9. `seed-reports.ts` - Creates reports (depends on orgs, users)

## Common Issues and Solutions

### Issue: Foreign Key Constraint Violation

**Cause:** Trying to insert data that references non-existent foreign keys.

**Solution:** Ensure seeds run in the correct order. Check that referenced IDs exist in seed-constants.ts.

### Issue: Unique Constraint Violation

**Cause:** Running seed multiple times without clearing.

**Solution:** Run `npm run seed:clear` before seeding, or use UPSERT logic in seeds.

### Issue: Enum Value Not Found

**Cause:** Schema was updated with new enum values but seed wasn't updated.

**Solution:** Check the schema for current enum values and update seed accordingly.

## Database Connections

### PostgreSQL (Identity, PM, Chat, Meeting, Notification, RAG)
```
Host: localhost:41000
User: uts
Password: uts_dev_pw
Databases: identity_db, pm_db, chat_db, meeting_db, notification_db, rag_db
```

### MongoDB (File-Storage, Tenant-BFF)
```
URI: mongodb://localhost:27017
Databases: file_storage, tenant_bff
```

## Running Seeds

```bash
# Run all seeds
npm run seed

# Run specific seed
npx tsx scripts/seeds/seed-users.ts
npx tsx scripts/seeds/seed-projects.ts
npx tsx scripts/seeds/seed-chat.ts

# Clear all seed data
npm run seed:clear

# Reset and reseed
npm run seed:reset
```

## AI Assistant Instructions

When the AI assistant (Claude) modifies any schema:

1. **Immediately** check which seed file is affected using the mapping table above
2. **Update** the seed file to reflect the schema change
3. **Update** seed-constants.ts if new IDs or enum values are added
4. **Update** this SEED_GUIDE.md if new tables/collections are added
5. **Test** the seed by running it

Example prompt for Claude:
```
When you modify a schema file, always:
1. Find the corresponding seed file in scripts/seeds/
2. Update the seed data to match the new schema
3. Update SEED_GUIDE.md if needed
4. Let me know what seed changes were made
```

## Changelog

| Date | Schema Change | Seed File Updated | Notes |
|------|--------------|-------------------|-------|
| 2024-12-18 | Initial seed structure | All files | Created comprehensive seed system |
| 2024-12-18 | Added folderId to file_metadata | seed-files.ts | UC14 File Management |
