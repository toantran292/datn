# Chat-Web Feature Analysis

Phân tích các chức năng hiện có và cần bổ sung của chat-web dựa trên Use Cases của B2203514.

**Ngày phân tích:** 2024-12-16

---

## TỔNG QUAN

| Nhóm | Tổng UC | Đã hoàn thành | Chưa hoàn thành | Tiến độ |
|------|---------|---------------|-----------------|---------|
| Quản lý Kênh (UC01-UC04) | 4 | 2 | 2 | 50% |
| Tin nhắn (UC05-UC09) | 5 | 2 | 3 | 40% |
| Tìm kiếm (UC10) | 1 | 0 | 1 | 0% |
| AI Features (UC11-UC14) | 4 | 0 | 4 | 0% |
| Thông báo (UC15) | 1 | 0 | 1 | 0% |
| **TỔNG** | **15** | **4** | **11** | **27%** |

---

## CHI TIẾT TỪNG USE CASE

### NHÓM 1: QUẢN LÝ KÊNH (UC01-UC04)

#### UC01 - Quản lý kênh trò chuyện

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Tạo kênh mới (channel) | ✅ Đã có | `CreateChannelModal.tsx`, API `createChannel` |
| Tạo kênh công khai/riêng tư | ✅ Đã có | isPrivate flag |
| Tạo kênh theo project | ✅ Đã có | projectId support |
| Cập nhật thông tin kênh | ❌ Chưa có | Cần thêm edit channel modal |
| Xóa kênh | ❌ Chưa có | Cần thêm delete channel |
| Lưu trữ kênh (archived) | ❌ Chưa có | Cần thêm archive feature |

**Files liên quan:**
- `components/left-sidebar/components/CreateChannelModal.tsx`
- `services/api.ts` - `createChannel()`

---

#### UC02 - Quản lý thành viên kênh

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Xem danh sách thành viên | ✅ Đã có | `MembersTab.tsx`, API `listRoomMembers` |
| Mời thành viên vào kênh | ❌ Chưa có | Cần thêm invite modal |
| Xóa thành viên khỏi kênh | ❌ Chưa có | Cần thêm remove member |
| Phân quyền Admin/Member | ❌ Chưa có | Cần thêm role management |

**Files liên quan:**
- `components/right-sidebar/MembersTab.tsx`
- `services/api.ts` - `listRoomMembers()`

---

#### UC03 - Cấu hình AI cho kênh

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Bật/tắt AI Assistant | ❌ Chưa có | Cần thêm AI settings |
| Chọn tính năng AI cho kênh | ❌ Chưa có | Cần thêm AI feature toggles |

**Cần tạo:**
- `components/right-sidebar/AISettingsTab.tsx`
- Channel settings modal với AI config

---

#### UC04 - Tham gia kênh

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Xem danh sách kênh công khai | ✅ Đã có | `BrowseChannelsModal.tsx` |
| Tham gia kênh công khai | ✅ Đã có | API `joinRoom` |
| Rời khỏi kênh | ❌ Chưa có | Cần thêm leave channel |

**Files liên quan:**
- `components/left-sidebar/components/BrowseChannelsModal.tsx`
- `services/api.ts` - `browsePublicRooms()`, `joinRoom()`

---

### NHÓM 2: TIN NHẮN (UC05-UC09)

#### UC05 - Gửi/nhận tin nhắn

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Gửi tin nhắn văn bản | ✅ Đã có | `ChatWindow.tsx` |
| Nhận tin nhắn real-time | ✅ Đã có | WebSocket `socket.ts` |
| Tải lịch sử tin nhắn | ✅ Đã có | API `listMessages` |
| Tin nhắn có định dạng (markdown) | ❌ Chưa có | Cần thêm markdown support |
| Rich text editor | ❌ Chưa có | Cần thêm editor (bold, italic, code) |

**Files liên quan:**
- `components/main/ChatWindow.tsx`
- `services/socket.ts`
- `hooks/use-chat-messages.ts`

---

#### UC06 - Tạo thread thảo luận

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Tạo thread từ tin nhắn | ✅ Đã có | Reply button, `ThreadView.tsx` |
| Xem thread trong panel | ✅ Đã có | Right sidebar với thread view |
| Gửi tin nhắn trong thread | ✅ Đã có | `sendReply` function |
| Hiển thị số reply | ✅ Đã có | `replyCount` display |

**Files liên quan:**
- `components/right-sidebar/ThreadView.tsx`
- `hooks/use-chat-threads.ts`
- `services/api.ts` - `listThreadMessages()`

---

#### UC07 - Tương tác tin nhắn

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Thêm reaction (emoji) | ❌ Chưa có | Cần thêm emoji picker + reactions |
| Reply tin nhắn | ⚠️ Một phần | Chỉ có thread reply, chưa có inline reply |
| Chỉnh sửa tin nhắn | ❌ Chưa có | Cần thêm edit message |
| Xóa tin nhắn | ❌ Chưa có | Cần thêm delete message |
| Ghim tin nhắn | ❌ Chưa có | Cần thêm pin message |

**Cần tạo:**
- Message action toolbar với reaction, edit, delete, pin
- Emoji picker component
- Edit message modal/inline

---

#### UC08 - Gửi tệp đính kèm

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Upload file đính kèm | ❌ Chưa có | Cần tích hợp File Service |
| Kéo thả file | ❌ Chưa có | Cần thêm drag & drop |
| Preview file trước khi gửi | ❌ Chưa có | Cần thêm file preview |
| Hiển thị file trong tin nhắn | ❌ Chưa có | Cần thêm file message type |

**Cần tạo:**
- File upload component
- File preview component
- Integration với File Storage service

---

#### UC09 - Xem/tải tệp

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Xem danh sách file trong kênh | ⚠️ Placeholder | `FilesTab.tsx` - chưa có logic |
| Preview file (image, PDF) | ❌ Chưa có | Cần thêm file viewer |
| Tải file về máy | ❌ Chưa có | Cần thêm download function |

**Files liên quan:**
- `components/right-sidebar/FilesTab.tsx` (placeholder)

---

### NHÓM 3: TÌM KIẾM (UC10)

#### UC10 - Tìm kiếm tin nhắn

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Search box (Ctrl+K) | ❌ Chưa có | Cần thêm search modal |
| Tìm kiếm full-text | ❌ Chưa có | Cần API search |
| Highlight kết quả | ❌ Chưa có | Cần highlight component |
| Filter theo kênh, người gửi, thời gian | ❌ Chưa có | Cần advanced filters |
| Tìm kiếm ngữ nghĩa (semantic) | ❌ Chưa có | Cần vector search |

**Cần tạo:**
- `components/search/SearchModal.tsx`
- `components/search/SearchResults.tsx`
- API endpoints cho search

---

### NHÓM 4: AI FEATURES (UC11-UC14)

#### UC11 - Tóm tắt hội thoại

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Chọn tin nhắn để tóm tắt | ❌ Chưa có | Cần message selection |
| Button "Tóm tắt với AI" | ❌ Chưa có | Cần AI action button |
| Hiển thị bản tóm tắt | ❌ Chưa có | Cần AI response panel |
| Tóm tắt từ lần truy cập cuối | ❌ Chưa có | Cần track last visit |

---

#### UC12 - Trích xuất action items

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Panel AI Assistant | ❌ Chưa có | Cần thêm AI sidebar tab |
| Extract action items | ❌ Chưa có | Cần AI integration |
| Hiển thị danh sách tasks | ❌ Chưa có | Cần task list component |
| Export action items | ❌ Chưa có | Cần export function |

---

#### UC13 - Hỏi đáp theo ngữ cảnh (RAG)

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Chat input cho AI | ❌ Chưa có | Cần AI chat interface |
| RAG query execution | ❌ Chưa có | Cần backend RAG |
| Hiển thị nguồn tham chiếu | ❌ Chưa có | Cần source citations |
| Click to navigate | ❌ Chưa có | Cần message navigation |

---

#### UC14 - Tóm tắt tài liệu

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Button tóm tắt trên file | ❌ Chưa có | Cần file action menu |
| Gọi AI Service | ❌ Chưa có | Cần AI integration |
| Hiển thị tóm tắt file | ❌ Chưa có | Cần summary display |

**Cần tạo chung cho AI Features:**
- `components/ai/AIAssistantPanel.tsx`
- `components/ai/AISummary.tsx`
- `components/ai/AIActionItems.tsx`
- `components/ai/AIChat.tsx`
- `services/ai.ts` - AI Service client
- `hooks/use-ai.ts`

---

### NHÓM 5: THÔNG BÁO (UC15)

#### UC15 - Quản lý thông báo kênh

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Cài đặt mức độ thông báo | ❌ Chưa có | Cần notification settings |
| Badge tin chưa đọc | ❌ Chưa có | Cần unread count |
| Đánh dấu đã đọc | ❌ Chưa có | Cần mark as read |
| Notification toast | ❌ Chưa có | Cần toast notifications |

**Cần tạo:**
- `components/notifications/NotificationSettings.tsx`
- Unread badge in rooms list
- Integration với Notification service

---

## DANH SÁCH CÔNG VIỆC CẦN LÀM

### Ưu tiên cao (Bắt buộc)

1. **UC07 - Message Interactions**
   - [ ] Emoji reactions
   - [ ] Edit message
   - [ ] Delete message
   - [ ] Pin message

2. **UC08 - File Attachments**
   - [ ] File upload component
   - [ ] Drag & drop support
   - [ ] File message display
   - [ ] Integration với File Storage

3. **UC09 - View/Download Files**
   - [ ] File viewer (image, PDF)
   - [ ] Download functionality
   - [ ] Files list in channel

4. **UC01 - Channel Management (còn thiếu)**
   - [ ] Edit channel modal
   - [ ] Delete channel
   - [ ] Archive channel

5. **UC02 - Member Management (còn thiếu)**
   - [ ] Invite member modal
   - [ ] Remove member
   - [ ] Role management

### Ưu tiên trung bình (Quan trọng)

6. **UC10 - Search**
   - [ ] Search modal (Ctrl+K)
   - [ ] Full-text search API
   - [ ] Search results with highlight
   - [ ] Advanced filters

7. **UC05 - Rich Text Messages**
   - [ ] Markdown support
   - [ ] Rich text editor

8. **UC04 - Leave Channel**
   - [ ] Leave channel button
   - [ ] Confirmation dialog

9. **UC15 - Notifications**
   - [ ] Notification settings per channel
   - [ ] Unread badge
   - [ ] Mark as read

### Ưu tiên thấp (AI Features - Quan trọng nhưng phức tạp)

10. **UC03 - AI Configuration**
    - [ ] AI settings tab in channel
    - [ ] Feature toggles

11. **UC11 - Summarize Conversation**
    - [ ] Message selection
    - [ ] AI summarization
    - [ ] Summary display

12. **UC12 - Extract Action Items**
    - [ ] AI Assistant panel
    - [ ] Action items extraction
    - [ ] Task list display

13. **UC13 - RAG Q&A**
    - [ ] AI chat interface
    - [ ] RAG integration
    - [ ] Source citations

14. **UC14 - Document Summary**
    - [ ] File action menu
    - [ ] Document summarization

---

## CẤU TRÚC THƯ MỤC ĐỀ XUẤT

```
apps/chat-web/src/
├── components/
│   ├── ai/                    # NEW - AI Features
│   │   ├── AIAssistantPanel.tsx
│   │   ├── AISummary.tsx
│   │   ├── AIActionItems.tsx
│   │   └── AIChat.tsx
│   ├── files/                 # NEW - File Features
│   │   ├── FileUpload.tsx
│   │   ├── FilePreview.tsx
│   │   ├── FileViewer.tsx
│   │   └── FileMessage.tsx
│   ├── search/                # NEW - Search Features
│   │   ├── SearchModal.tsx
│   │   └── SearchResults.tsx
│   ├── notifications/         # NEW - Notification Features
│   │   └── NotificationSettings.tsx
│   ├── message/               # NEW - Message Components
│   │   ├── MessageActions.tsx
│   │   ├── EmojiPicker.tsx
│   │   ├── EditMessageModal.tsx
│   │   └── RichTextEditor.tsx
│   └── channel/               # NEW - Channel Management
│       ├── EditChannelModal.tsx
│       ├── ChannelSettings.tsx
│       └── InviteMemberModal.tsx
├── services/
│   ├── api.ts
│   ├── socket.ts
│   ├── ai.ts                  # NEW - AI Service client
│   └── files.ts               # NEW - File Service client
└── hooks/
    ├── use-ai.ts              # NEW
    ├── use-files.ts           # NEW
    ├── use-search.ts          # NEW
    └── use-notifications.ts   # NEW
```

---

## TÍCH HỢP VỚI BACKEND SERVICES

| Frontend Feature | Backend Service | API Endpoint |
|------------------|-----------------|--------------|
| File Upload | file-storage | POST /files |
| File Download | file-storage | GET /files/:id |
| Search Messages | chat-service | GET /messages/search |
| AI Summarize | ai-service (chat-bff) | POST /ai/summarize |
| AI Action Items | ai-service (chat-bff) | POST /ai/extract-actions |
| AI Q&A | ai-service (chat-bff) | POST /ai/query |
| AI Doc Summary | ai-service (chat-bff) | POST /ai/summarize-doc |
| Notifications | notification-service | WebSocket |

---

## GHI CHÚ

1. **Thứ tự triển khai nên theo ưu tiên:**
   - Hoàn thiện các chức năng cơ bản (file, reactions, edit/delete)
   - Thêm search và notifications
   - Cuối cùng là AI features

2. **Dependencies:**
   - File features cần file-storage service hoạt động
   - AI features cần ai-service (LLM integration)
   - Search cần backend search indexing

3. **UI/UX considerations:**
   - Message actions nên dùng hover toolbar
   - AI features nên có dedicated panel/tab
   - Search modal nên giống Slack (Ctrl+K)
