# B2203514 - Chat Service Implementation Analysis

Phan tich hien trang va cong viec can thuc hien cho chat-service.

## 1. Tong quan hien trang

### Cong nghe dang su dung
| Component | Technology |
|-----------|------------|
| Framework | NestJS (TypeScript) |
| Real-time | Socket.io |
| Database | Apache Cassandra |
| Port | 40500 |

### Cau truc thu muc hien tai

```
chat-service/src/
├── main.ts                      # Entry point
├── app.module.ts                # Root module
├── cassandra/                   # Cassandra config (CAN XOA)
├── chat/                        # Chat messaging
│   ├── chat.controller.ts       # REST endpoints
│   ├── chat.service.ts          # Business logic
│   ├── chat.gateway.ts          # WebSocket gateway
│   └── repositories/
│       └── messages.repository.ts
├── rooms/                       # Room management
│   ├── rooms.controller.ts
│   ├── rooms.service.ts
│   ├── repositories/
│   │   ├── room.repository.ts
│   │   └── room-members.repository.ts
│   └── dto/
├── common/
│   ├── context/                 # Request context
│   ├── identity/                # Identity service integration
│   └── presence/                # Online/offline tracking
└── internal/                    # Internal APIs
```

---

## 2. Trang thai Implementation theo Use Case

### Bang tong hop

| UC | Ten | Trang thai | % Hoan thanh | Ghi chu |
|----|-----|------------|--------------|---------|
| UC01 | Quan ly kenh tro chuyen | Partial | 60% | Thieu archive, update |
| UC02 | Quan ly thanh vien kenh | Partial | 40% | Thieu phan quyen, xoa thanh vien |
| UC03 | Cau hinh AI cho kenh | Not Started | 0% | Chua co AI |
| UC04 | Tham gia kenh | Done | 90% | Thieu roi kenh |
| UC05 | Gui/nhan tin nhan | Done | 95% | Hoan chinh |
| UC06 | Tao thread thao luan | Partial | 70% | Co thread, thieu reply count |
| UC07 | Tuong tac tin nhan | Not Started | 0% | Thieu reaction, edit, delete, pin |
| UC08 | Gui tep dinh kem | Not Started | 0% | Chua tich hop file-storage |
| UC09 | Xem/tai tep | Not Started | 0% | Chua tich hop file-storage |
| UC10 | Tim kiem tin nhan | Not Started | 0% | Chua co search |
| UC11 | Tom tat hoi thoai | Not Started | 0% | Chua co AI |
| UC12 | Trich xuat action items | Not Started | 0% | Chua co AI |
| UC13 | Hoi dap theo ngu canh | Not Started | 0% | Chua co AI |
| UC14 | Tom tat tai lieu | Not Started | 0% | Chua co AI |
| UC15 | Quan ly thong bao kenh | Not Started | 0% | Chua tich hop notification |

### Tong ket: **~25% hoan thanh**

---

## 3. Chi tiet tinh nang da implement

### 3.1 UC01 - Quan ly kenh (60%)

**Da co:**
- [x] Tao kenh moi (channel)
- [x] Tao kenh rieng tu (private)
- [x] Tao kenh theo du an (project_id)
- [x] Luu ten, mo ta kenh

**Chua co:**
- [ ] Cap nhat thong tin kenh
- [ ] Xoa kenh
- [ ] Luu tru (archive) kenh
- [ ] Avatar kenh

### 3.2 UC02 - Quan ly thanh vien (40%)

**Da co:**
- [x] Them thanh vien khi tao kenh
- [x] Xem danh sach thanh vien
- [x] Tham gia kenh cong khai

**Chua co:**
- [ ] Moi thanh vien moi
- [ ] Xoa thanh vien khoi kenh
- [ ] Phan quyen Admin/Member
- [ ] Kiem tra quyen truoc khi thao tac

### 3.3 UC04 - Tham gia kenh (90%)

**Da co:**
- [x] Xem danh sach kenh cong khai
- [x] Tham gia kenh cong khai
- [x] Xem danh sach kenh da tham gia

**Chua co:**
- [ ] Roi khoi kenh
- [ ] Yeu cau tham gia kenh rieng tu

### 3.4 UC05 - Gui/nhan tin nhan (95%)

**Da co:**
- [x] Gui tin nhan van ban
- [x] Nhan tin nhan real-time (WebSocket)
- [x] Lich su tin nhan (pagination)
- [x] Luu tru tin nhan

**Chua co:**
- [ ] Dinh dang markdown
- [ ] @mention nguoi dung

### 3.5 UC06 - Thread thao luan (70%)

**Da co:**
- [x] Tao thread tu tin nhan
- [x] Gui tin nhan trong thread
- [x] Luu thread_id trong message

**Chua co:**
- [ ] Dem so reply
- [ ] Hien thi reply count tren tin nhan goc
- [ ] Thong bao khi co reply moi

---

## 4. Cong viec Migration Cassandra -> PostgreSQL

### 4.1 Database Schema Migration

**Cassandra Tables hien tai:**

```
chat.rooms
chat.room_members
chat.messages
chat.threads
chat.user_rooms (denormalized)
chat.user_project_rooms (denormalized)
chat.user_dms (denormalized)
chat.schema_migrations
```

**PostgreSQL Tables can tao:**

```sql
-- 1. rooms (kenh)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  project_id UUID,
  name VARCHAR(100),
  description TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'channel', -- channel | dm
  is_private BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE | ARCHIVED | DELETED
  avatar_url VARCHAR(500),
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP
);

CREATE INDEX idx_rooms_org ON rooms(org_id);
CREATE INDEX idx_rooms_org_project ON rooms(org_id, project_id);

-- 2. room_members (thanh vien kenh)
CREATE TABLE room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  org_id UUID NOT NULL,
  role VARCHAR(20) DEFAULT 'MEMBER', -- ADMIN | MEMBER
  last_seen_message_id UUID,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  invited_by UUID,
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_members_user ON room_members(user_id, org_id);

-- 3. messages (tin nhan)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  org_id UUID NOT NULL,
  thread_id UUID REFERENCES messages(id),
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text', -- text | file | system
  format VARCHAR(20) DEFAULT 'plain', -- plain | markdown
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_room_time ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_thread ON messages(thread_id) WHERE thread_id IS NOT NULL;

-- 4. message_attachments (tep dinh kem)
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. message_reactions (reactions)
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);

-- 6. pinned_messages (tin nhan ghim)
CREATE TABLE pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL,
  pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. notification_settings (cau hinh thong bao)
CREATE TABLE channel_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  level VARCHAR(20) DEFAULT 'all', -- all | mentions | none
  muted_until TIMESTAMP,
  sound_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);

-- 8. ai_config (cau hinh AI cho kenh)
CREATE TABLE channel_ai_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID UNIQUE NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  feature_summarize BOOLEAN DEFAULT true,
  feature_qa BOOLEAN DEFAULT true,
  feature_action_items BOOLEAN DEFAULT true,
  feature_document_summary BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID
);
```

### 4.2 Code Changes Required

**Files can xoa:**
```
- cassandra/cassandra.module.ts
- db/migrations/*.cql
- db/apply-schema.ts
```

**Files can tao moi:**
```
+ database/database.module.ts (TypeORM/Prisma config)
+ database/entities/*.entity.ts
+ database/migrations/*.ts
```

**Files can sua:**
```
~ chat/repositories/messages.repository.ts
~ rooms/repositories/room.repository.ts
~ rooms/repositories/room-members.repository.ts
~ app.module.ts (thay CassandraModule -> DatabaseModule)
```

### 4.3 Key Changes

| Cassandra | PostgreSQL |
|-----------|------------|
| `types.TimeUuid` | `UUID` |
| `types.Uuid` | `UUID` |
| Batch queries | Transactions |
| `pageState` cursor | OFFSET/LIMIT or keyset pagination |
| Denormalized tables | Normalized + JOINs |

---

## 5. Cong viec can thuc hien (TODO List)

### Phase 1: Migration Database (Uu tien cao)

- [ ] **1.1** Cai dat va cau hinh TypeORM/Prisma
- [ ] **1.2** Tao cac entity classes
- [ ] **1.3** Tao migration files
- [ ] **1.4** Refactor messages.repository.ts
- [ ] **1.5** Refactor room.repository.ts
- [ ] **1.6** Refactor room-members.repository.ts
- [ ] **1.7** Xoa cassandra module va dependencies
- [ ] **1.8** Update pagination logic (keyset pagination)
- [ ] **1.9** Test tat ca endpoints

### Phase 2: Hoan thien UC co ban (Uu tien cao)

#### UC01 - Quan ly kenh
- [ ] **2.1** API cap nhat thong tin kenh (PUT /rooms/:roomId)
- [ ] **2.2** API xoa kenh (DELETE /rooms/:roomId)
- [ ] **2.3** API luu tru kenh (POST /rooms/:roomId/archive)
- [ ] **2.4** Upload avatar kenh

#### UC02 - Quan ly thanh vien
- [ ] **2.5** API moi thanh vien (POST /rooms/:roomId/members)
- [ ] **2.6** API xoa thanh vien (DELETE /rooms/:roomId/members/:userId)
- [ ] **2.7** API phan quyen (PUT /rooms/:roomId/members/:userId/role)
- [ ] **2.8** Middleware kiem tra quyen

#### UC04 - Tham gia kenh
- [ ] **2.9** API roi kenh (POST /rooms/:roomId/leave)

### Phase 3: Tinh nang Messaging mo rong (Uu tien trung binh)

#### UC06 - Thread
- [ ] **3.1** Tinh reply_count cho thread
- [ ] **3.2** WebSocket event thread:new-reply

#### UC07 - Tuong tac tin nhan
- [ ] **3.3** API them reaction (POST /messages/:messageId/reactions)
- [ ] **3.4** API xoa reaction (DELETE /messages/:messageId/reactions/:emoji)
- [ ] **3.5** API sua tin nhan (PUT /messages/:messageId)
- [ ] **3.6** API xoa tin nhan (DELETE /messages/:messageId)
- [ ] **3.7** API ghim tin nhan (POST /messages/:messageId/pin)
- [ ] **3.8** API bo ghim (DELETE /messages/:messageId/pin)
- [ ] **3.9** API lay danh sach tin nhan ghim

### Phase 4: File Handling (Uu tien trung binh)

#### UC08 & UC09 - File attachment
- [ ] **4.1** Tich hop voi file-storage service
- [ ] **4.2** API upload file (POST /rooms/:roomId/messages/upload)
- [ ] **4.3** Luu attachment metadata
- [ ] **4.4** API preview file
- [ ] **4.5** API download file

### Phase 5: Search (Uu tien trung binh)

#### UC10 - Tim kiem
- [ ] **5.1** Full-text search voi PostgreSQL (tsvector)
- [ ] **5.2** API tim kiem (GET /search/messages)
- [ ] **5.3** Bo loc theo kenh, nguoi gui, thoi gian
- [ ] **5.4** Highlight ket qua

### Phase 6: Thong bao (Uu tien trung binh)

#### UC15 - Notification
- [ ] **6.1** API cau hinh thong bao kenh
- [ ] **6.2** API lay tin chua doc
- [ ] **6.3** API danh dau da doc
- [ ] **6.4** Tich hop notification-service

### Phase 7: AI Features (Uu tien thap - can LLM integration)

#### UC03 - Cau hinh AI
- [ ] **7.1** API cau hinh AI cho kenh
- [ ] **7.2** UI toggle AI features

#### UC11 - Tom tat hoi thoai
- [ ] **7.3** Tich hop LLM (OpenAI/Claude)
- [ ] **7.4** API tom tat (POST /ai/summarize)
- [ ] **7.5** Streaming response

#### UC12 - Trich xuat action items
- [ ] **7.6** API trich xuat (POST /ai/action-items)
- [ ] **7.7** Export CSV/Markdown

#### UC13 - Hoi dap RAG
- [ ] **7.8** Cai dat vector database (pgvector)
- [ ] **7.9** Index messages vao vector DB
- [ ] **7.10** API hoi dap (POST /ai/qa)

#### UC14 - Tom tat tai lieu
- [ ] **7.11** Document parser (PDF, DOCX)
- [ ] **7.12** API tom tat tai lieu (POST /ai/document-summary)

---

## 6. Uu tien thuc hien

### Sprint 1 (Tuan 1-2): Database Migration
1. Cai dat TypeORM
2. Tao entities va migrations
3. Refactor repositories
4. Test endpoints

### Sprint 2 (Tuan 3-4): Core Features
1. Hoan thien UC01, UC02, UC04
2. Implement UC07 (reactions, edit, delete)
3. Thread reply count

### Sprint 3 (Tuan 5-6): File & Search
1. File attachment (UC08, UC09)
2. Full-text search (UC10)

### Sprint 4 (Tuan 7-8): Notifications & AI Setup
1. Notification settings (UC15)
2. AI config (UC03)
3. LLM integration setup

### Sprint 5 (Tuan 9-10): AI Features
1. Summarize (UC11)
2. Action items (UC12)
3. RAG Q&A (UC13)
4. Document summary (UC14)

---

## 7. Dependencies can them

```json
{
  "dependencies": {
    "@nestjs/typeorm": "^10.x",
    "typeorm": "^0.3.x",
    "pg": "^8.x",
    "pgvector": "^0.1.x",
    "@langchain/core": "^0.1.x",
    "@langchain/openai": "^0.1.x",
    "pdf-parse": "^1.x",
    "mammoth": "^1.x"
  }
}
```

---

## 8. Risks va Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data migration errors | High | Backup data, test migration script |
| Performance degradation | Medium | Add proper indexes, use connection pooling |
| Breaking API changes | Medium | Versioning, gradual rollout |
| AI cost overrun | Medium | Rate limiting, caching responses |
| File storage integration | Low | Use existing file-storage service |

---

## 9. Checklist hoan thanh

- [ ] Cassandra -> PostgreSQL migration
- [ ] 15/15 Use Cases implemented
- [ ] Unit tests > 80% coverage
- [ ] Integration tests
- [ ] API documentation (Swagger)
- [ ] Performance benchmarks
- [ ] Security audit
