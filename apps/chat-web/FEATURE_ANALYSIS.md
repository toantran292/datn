# Chat-Web Feature Analysis

Phân tích các chức năng hiện có và cần bổ sung của chat-web dựa trên Use Cases của B2203514.

**Ngày phân tích:** 2024-12-16
**Cập nhật lần cuối:** 2024-12-16

---

## TỔNG QUAN

| Nhóm | Tổng UC | Đã hoàn thành | Chưa hoàn thành | Tiến độ |
|------|---------|---------------|-----------------|---------|
| Quản lý Kênh (UC01-UC04) | 4 | 4 | 0 | 100% |
| Tin nhắn (UC05-UC09) | 5 | 5 | 0 | 100% |
| Tìm kiếm (UC10) | 1 | 1 | 0 | 100% |
| AI Features (UC11-UC14) | 4 | 3 | 1 | 75% |
| Thông báo (UC15) | 1 | 1 | 0 | 100% |
| **TỔNG** | **15** | **14** | **1** | **93%** |

---

## CHI TIẾT TỪNG USE CASE

### NHÓM 1: QUẢN LÝ KÊNH (UC01-UC04)

#### UC01 - Quản lý kênh trò chuyện ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Tạo kênh mới (channel) | ✅ Đã có | `CreateChannelModal.tsx`, API `createChannel` |
| Tạo kênh công khai/riêng tư | ✅ Đã có | isPrivate flag |
| Tạo kênh theo project | ✅ Đã có | projectId support |
| Cập nhật thông tin kênh | ✅ Đã có | `EditChannelModal.tsx`, API `updateChannel` |
| Xóa kênh | ✅ Đã có | `ConfirmChannelActionModal.tsx`, API `deleteChannel` |
| Lưu trữ kênh (archived) | ✅ Đã có | `ConfirmChannelActionModal.tsx`, API `archiveChannel` |
| Phân quyền owner (createdBy) | ✅ Đã có | Backend trả về `createdBy`, frontend check ownership |
| Phân quyền org owner | ✅ Đã có | Org owner có quyền admin trên tất cả channels |

**Files liên quan:**
- `components/modals/CreateChannelModal.tsx`
- `components/modals/EditChannelModal.tsx`
- `components/modals/ConfirmChannelActionModal.tsx`
- `components/sidebar/ChannelSettingsDropdown.tsx`
- `services/api.ts` - `createChannel()`, `updateChannel()`, `deleteChannel()`, `archiveChannel()`

**Backend changes:**
- `rooms.service.ts` - Creator được thêm với role ADMIN, permission check cho phép ADMIN, createdBy và org owner
- `rooms.controller.ts` - Trả về `createdBy` trong response
- `rooms.mapper.ts` - Map `createdBy` và `description` vào DTO
- `identity.service.ts` - Thêm method `isOrgOwner()` để check org ownership

**Frontend changes:**
- `ChatContext.tsx` - Thêm `isOrgOwner` computed từ `user.roles`
- `Sidebar.tsx` - Truyền `isOrgOwner` prop, check `isOwner={room.createdBy === currentUserId || isOrgOwner}`

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

#### UC03 - Cấu hình AI cho kênh ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Bật/tắt AI Assistant | ✅ Đã có | `AISettingsTab.tsx`, API `updateAIConfig` |
| Chọn tính năng AI cho kênh | ✅ Đã có | Toggle từng feature: summary, action_items, qa, document_summary |
| Phân quyền cấu hình AI | ✅ Đã có | Chỉ OWNER/ADMIN workspace mới có quyền bật AI |
| Default AI disabled | ✅ Đã có | AI mặc định tắt cho tất cả channels |

**Files liên quan:**
- `components/details/AISettingsTab.tsx` - AI settings panel trong right sidebar
- `components/details/DetailsPanel.tsx` - Thêm AI tab
- `services/api.ts` - `getAIConfig()`, `updateAIConfig()`, `toggleAIFeature()`

**Backend changes:**
- `channel-ai-config.entity.ts` - Default `aiEnabled = false`
- `channel-ai-config.repository.ts` - Default disabled, no features enabled
- `ai.service.ts` - Permission check cho org owner
- `ai.controller.ts` - Endpoints để get/update AI config

**Permission model:**
- Chỉ workspace OWNER/ADMIN có thể bật/tắt AI và configure features
- Các thành viên khác chỉ xem được trạng thái AI settings (view only)
- AI features mặc định tắt khi tạo channel mới

---

#### UC04 - Tham gia kênh ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Xem danh sách kênh công khai | ✅ Đã có | `BrowseChannelsModal.tsx` |
| Tham gia kênh công khai | ✅ Đã có | API `joinRoom` |
| Rời khỏi kênh | ✅ Đã có | `ChannelSettingsDropdown.tsx`, API `leaveChannel` |

**Files liên quan:**
- `components/modals/BrowseChannelsModal.tsx`
- `components/sidebar/ChannelSettingsDropdown.tsx`
- `services/api.ts` - `browsePublicRooms()`, `joinRoom()`, `leaveChannel()`

---

### NHÓM 2: TIN NHẮN (UC05-UC09)

#### UC05 - Gửi/nhận tin nhắn ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Gửi tin nhắn văn bản | ✅ Đã có | `ChatWindow.tsx`, `MessageComposer.tsx` |
| Nhận tin nhắn real-time | ✅ Đã có | WebSocket `socket.ts` |
| Tải lịch sử tin nhắn | ✅ Đã có | API `listMessages` |
| Rich text editor | ✅ Đã có | `RichTextEditor.tsx` với bold, italic, code, lists |
| Mention users (@) | ✅ Đã có | `RichTextEditor.tsx` - mention handler |
| Hiển thị mentions | ✅ Đã có | `MessageItem.tsx` - processMessageContent |

**Files liên quan:**
- `components/chat/ChatWindow.tsx`
- `components/chat/MessageComposer.tsx`
- `components/chat/RichTextEditor.tsx`
- `components/chat/MessageItem.tsx`
- `services/socket.ts`

---

#### UC06 - Tạo thread thảo luận ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Tạo thread từ tin nhắn | ✅ Đã có | Reply button, `ThreadView.tsx` |
| Xem thread trong panel | ✅ Đã có | Right sidebar với thread view |
| Gửi tin nhắn trong thread | ✅ Đã có | `MessageComposer` trong ThreadView |
| Hiển thị số reply | ✅ Đã có | `replyCount` display |
| Mention trong thread | ✅ Đã có | ThreadView sử dụng MessageComposer |

**Files liên quan:**
- `components/details/ThreadView.tsx`
- `contexts/ChatContext.tsx` - `handleSendThreadReply()`
- `services/api.ts` - `listThreadMessages()`

---

#### UC07 - Tương tác tin nhắn ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Thêm reaction (emoji) | ✅ Đã có | `EmojiPicker.tsx`, `MessageReactions.tsx` |
| Reply tin nhắn (thread) | ✅ Đã có | Thread reply system |
| Chỉnh sửa tin nhắn | ✅ Đã có | `EditMessageModal.tsx`, API `editMessage` |
| Xóa tin nhắn | ✅ Đã có | `ConfirmDeleteModal.tsx`, API `deleteMessage` |
| Ghim tin nhắn | ✅ Đã có | `PinnedMessagesTab.tsx`, API `pinMessage/unpinMessage` |
| Message actions toolbar | ✅ Đã có | `MessageActions.tsx` - hover toolbar |

**Files liên quan:**
- `components/chat/MessageActions.tsx`
- `components/chat/EmojiPicker.tsx`
- `components/chat/MessageReactions.tsx`
- `components/modals/EditMessageModal.tsx`
- `components/modals/ConfirmDeleteModal.tsx`
- `components/details/PinnedMessagesTab.tsx`

---

#### UC08 - Gửi tệp đính kèm ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Upload file đính kèm | ✅ Đã có | `FilePreview.tsx`, `prepareUpload()` |
| Preview file trước khi gửi | ✅ Đã có | `FilePreviewList` component |
| Hiển thị file trong tin nhắn | ✅ Đã có | `FileAttachment.tsx`, `AttachmentList` |
| Upload progress indicator | ✅ Đã có | Progress bar trong FilePreview |
| Multiple file support | ✅ Đã có | Hỗ trợ nhiều file cùng lúc |

**Files liên quan:**
- `components/chat/FilePreview.tsx`
- `components/chat/FileAttachment.tsx`
- `components/chat/MessageComposer.tsx` - attach button
- `services/files.ts` - `prepareUpload()`, `uploadToPresignedUrl()`
- `contexts/ChatContext.tsx` - `handleFilesSelect()`, `handleFileRemove()`

---

#### UC09 - Xem/tải tệp ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Preview image inline | ✅ Đã có | `FileAttachment.tsx` - inline image preview |
| Preview PDF inline | ✅ Đã có | `FileAttachment.tsx` - inline iframe preview |
| Fullscreen image preview | ✅ Đã có | `ImagePreviewModal` với ESC key, Portal |
| Fullscreen PDF preview | ✅ Đã có | `PdfPreviewModal` với iframe, download |
| Tải file về máy | ✅ Đã có | Download button trên mỗi attachment |
| Compact mode nhiều file | ✅ Đã có | Grid layout với flex-wrap khi nhiều file |

**Files liên quan:**
- `components/chat/FileAttachment.tsx`
  - `ImagePreviewModal` - fullscreen image với Portal
  - `PdfPreviewModal` - fullscreen PDF với iframe
  - `AttachmentList` - smart layout single/multiple files

---

### NHÓM 3: TÌM KIẾM (UC10)

#### UC10 - Tìm kiếm tin nhắn ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Search box (Ctrl+K / ⌘K) | ✅ Đã có | `SearchModal.tsx`, keyboard shortcut |
| Tìm kiếm full-text | ✅ Đã có | PostgreSQL tsvector, API `searchMessages` |
| Highlight kết quả | ✅ Đã có | `<mark>` tags từ backend |
| Filter theo kênh | ✅ Đã có | Room filter trong SearchModal |
| Filter theo thời gian | ✅ Đã có | Start/End date filters |
| Navigate đến message | ✅ Đã có | Click result → chuyển room |

**Files liên quan:**
- `components/modals/SearchModal.tsx` - Search modal với filters
- `components/chat/ChatHeader.tsx` - Search button trong header
- `services/api.ts` - `searchMessages()`, `searchInRoom()`

**Backend changes:**
- `chat/repositories/search.repository.ts` - Full-text search với PostgreSQL tsvector
- `chat/chat.controller.ts` - `GET /messages/search`, `GET /messages/search/room/:roomId`
- `chat/chat.service.ts` - `searchAllRooms()`, `searchInRoom()`

**Features:**
- Debounced search (300ms)
- Minimum 2 characters
- Filter by channel, date range
- Highlighted results with `<mark>` tags
- Results show: channel name, user name, date, message preview
- Click to navigate to room
- Keyboard shortcut: ⌘K (Mac) / Ctrl+K (Windows)

---

### NHÓM 4: AI FEATURES (UC11-UC14)

#### UC11 - Tóm tắt hội thoại ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Button "Tóm tắt với AI" | ✅ Đã có | `AISettingsTab.tsx` - Summarize button |
| Tóm tắt tin nhắn gần nhất | ✅ Đã có | API `summarizeConversation` (50 messages) |
| Hiển thị bản tóm tắt | ✅ Đã có | Summary result với copy to clipboard |
| Loading state & error handling | ✅ Đã có | Spinner + error display |

**Files liên quan:**
- `components/details/AISettingsTab.tsx` - AI Assistant panel (sub-tab "Assistant")
- `services/api.ts` - `summarizeConversation()` API
- Backend: `ai.controller.ts` - `POST /ai/rooms/:roomId/summarize`

---

#### UC12 - Trích xuất action items ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Panel AI Assistant | ✅ Đã có | `AISettingsTab.tsx` - sub-tab "Assistant" |
| Extract action items | ✅ Đã có | API `extractActionItems` |
| Hiển thị danh sách tasks | ✅ Đã có | Numbered list với assignee + priority |
| Copy action items | ✅ Đã có | Copy to clipboard button |

**Files liên quan:**
- `components/details/AISettingsTab.tsx` - Action Items button + results display
- `services/api.ts` - `extractActionItems()` API
- Backend: `ai.controller.ts` - `POST /ai/rooms/:roomId/action-items`

---

#### UC13 - Hỏi đáp theo ngữ cảnh (RAG) ✅ HOÀN THÀNH

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Chat input cho AI | ✅ Đã có | Q&A input section trong AISettingsTab |
| RAG query execution | ✅ Đã có | API `askQuestion` với context messages |
| Hiển thị nguồn tham chiếu | ✅ Đã có | Sources section với message excerpts |
| Copy answer | ✅ Đã có | Copy to clipboard button |

**Files liên quan:**
- `components/details/AISettingsTab.tsx` - Q&A input + answer display + sources
- `services/api.ts` - `askQuestion()` API
- Backend: `ai.controller.ts` - `POST /ai/rooms/:roomId/query`

---

#### UC14 - Tóm tắt tài liệu

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Button tóm tắt trên file | ❌ Chưa có | Cần file action menu |
| Gọi AI Service | ✅ API sẵn sàng | `summarizeDocument()` API đã thêm |
| Hiển thị tóm tắt file | ❌ Chưa có | Cần summary display trong file preview |

**Files liên quan:**
- `services/api.ts` - `summarizeDocument()` API (đã thêm)
- Backend: `ai.controller.ts` - `POST /ai/documents/:attachmentId/summarize`

**Cần làm:**
- Thêm "Summarize" button vào FileAttachment.tsx
- Hiển thị document summary trong modal hoặc tooltip

---

### NHÓM 5: THÔNG BÁO (UC15) ✅ HOÀN THÀNH

#### UC15 - Quản lý thông báo kênh

| Chức năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Badge tin chưa đọc | ✅ Đã có | `UnreadBadge` trong ChannelItem, DMItem |
| Đánh dấu đã đọc | ✅ Đã có | Auto mark khi select room |
| Unread count tracking | ✅ Đã có | `unreadCounts` Map trong ChatContext |
| Cài đặt mức độ thông báo | ❌ Chưa có | Cần notification settings |

**Files liên quan:**
- `components/left-sidebar/components/ChannelItem.tsx` - UnreadBadge
- `components/left-sidebar/components/DMItem.tsx` - UnreadBadge
- `contexts/ChatContext.tsx` - `unreadCounts`, `getUnreadCount()`, `loadUnreadCounts()`
- `services/api.ts` - `getAllUnreadCounts()`, `markAsRead()`

---

## DANH SÁCH CÔNG VIỆC CẦN LÀM

### ✅ Đã hoàn thành (Sprint 4 + Sprint 5)

1. **UC01 - Channel Management** ✅
   - [x] Edit channel modal (`EditChannelModal.tsx`)
   - [x] Delete channel (`ConfirmChannelActionModal.tsx`)
   - [x] Archive channel (`ConfirmChannelActionModal.tsx`)
   - [x] Channel settings dropdown (`ChannelSettingsDropdown.tsx`)

2. **UC04 - Join/Leave Channel** ✅
   - [x] Leave channel (`ChannelSettingsDropdown.tsx`)
   - [x] Confirmation dialog (`ConfirmChannelActionModal.tsx`)

3. **UC07 - Message Interactions** ✅
   - [x] Emoji reactions (`EmojiPicker.tsx`, `MessageReactions.tsx`)
   - [x] Edit message (`EditMessageModal.tsx`)
   - [x] Delete message (`ConfirmDeleteModal.tsx`)
   - [x] Pin message (`PinnedMessagesTab.tsx`)
   - [x] Message actions toolbar (`MessageActions.tsx`)

4. **UC08 - File Attachments** ✅
   - [x] File upload component (`FilePreview.tsx`)
   - [x] File message display (`FileAttachment.tsx`)
   - [x] Upload progress indicator
   - [x] Multiple file support
   - [x] Integration với File Storage (presigned URLs)

5. **UC09 - View/Download Files** ✅
   - [x] Inline image preview
   - [x] Inline PDF preview (iframe)
   - [x] Fullscreen image preview modal (Portal + ESC)
   - [x] Fullscreen PDF preview modal
   - [x] Download functionality
   - [x] Compact grid layout for multiple files

6. **UC15 - Notifications (partial)** ✅
   - [x] Unread badge
   - [x] Mark as read on room select
   - [x] Unread count tracking

7. **UC05 - Rich Text Messages** ✅
   - [x] Rich text editor (`RichTextEditor.tsx`)
   - [x] @mentions support

8. **UC03 - AI Configuration** ✅
   - [x] AI settings tab (`AISettingsTab.tsx`)
   - [x] Toggle AI enabled/disabled
   - [x] Toggle individual AI features (summary, action_items, qa, document_summary)
   - [x] Permission check - only OWNER/ADMIN can configure
   - [x] Default AI disabled for all channels

9. **UC10 - Search** ✅
   - [x] Search modal (`SearchModal.tsx`)
   - [x] Keyboard shortcut (⌘K / Ctrl+K)
   - [x] Full-text search API (PostgreSQL tsvector)
   - [x] Search results with highlight
   - [x] Filter by channel, date range
   - [x] Navigate to room on result click

10. **UC11 - Summarize Conversation** ✅
    - [x] Summarize button trong AI Assistant tab
    - [x] API `summarizeConversation()` integration
    - [x] Summary result display với copy to clipboard
    - [x] Loading state và error handling

11. **UC12 - Extract Action Items** ✅
    - [x] Action Items button trong AI Assistant tab
    - [x] API `extractActionItems()` integration
    - [x] Task list display với assignee + priority badges
    - [x] Copy to clipboard

12. **UC13 - RAG Q&A** ✅
    - [x] Q&A input section trong AI Assistant tab
    - [x] API `askQuestion()` integration
    - [x] Answer display với copy to clipboard
    - [x] Source citations display

---

### Ưu tiên cao (Còn thiếu)

1. **UC02 - Member Management (còn thiếu)**
   - [ ] Invite member modal
   - [ ] Remove member
   - [ ] Role management

---

### Ưu tiên trung bình

1. **UC15 - Notification Settings**
   - [ ] Notification settings per channel
   - [ ] Notification toast

---

### Ưu tiên thấp (AI Features)

1. **UC14 - Document Summary (còn thiếu)**
    - [ ] Thêm "Summarize" button vào FileAttachment.tsx
    - [ ] Modal hiển thị document summary
    - [ ] Integration với `summarizeDocument()` API

---

## CẤU TRÚC THƯ MỤC HIỆN TẠI

```
apps/chat-web/src/
├── components/
│   ├── chat/                     # ✅ Message Components
│   │   ├── MessageItem.tsx       # ✅ Message display with actions
│   │   ├── MessageActions.tsx    # ✅ Hover toolbar
│   │   ├── MessageComposer.tsx   # ✅ Input with attachments
│   │   ├── MessageReactions.tsx  # ✅ Reaction badges
│   │   ├── RichTextEditor.tsx    # ✅ Rich text with mentions
│   │   ├── EmojiPicker.tsx       # ✅ Emoji selector
│   │   ├── FileAttachment.tsx    # ✅ File display + preview modals
│   │   ├── FilePreview.tsx       # ✅ Upload preview
│   │   └── ChatWindow.tsx        # ✅ Main chat area
│   ├── details/                  # ✅ Right Sidebar
│   │   ├── ThreadView.tsx        # ✅ Thread panel
│   │   ├── MembersTab.tsx        # ✅ Members list
│   │   ├── PinnedMessagesTab.tsx # ✅ Pinned messages
│   │   └── FilesTab.tsx          # Placeholder
│   ├── modals/                   # ✅ Modal dialogs
│   │   ├── EditMessageModal.tsx  # ✅ Edit message
│   │   ├── ConfirmDeleteModal.tsx# ✅ Delete confirmation
│   │   ├── EditChannelModal.tsx  # ✅ Edit channel
│   │   └── ConfirmChannelActionModal.tsx # ✅ Channel actions
│   ├── sidebar/                  # Sidebar components
│   │   ├── ChannelItem.tsx       # ✅ With unread badge + settings dropdown
│   │   ├── DMItem.tsx            # ✅ With unread badge
│   │   ├── ChannelSettingsDropdown.tsx # ✅ Edit/Delete/Archive/Leave
│   ├── ai/                       # TODO - AI Features
│   ├── search/                   # TODO - Search Features
│   └── notifications/            # TODO - Notification Settings
├── contexts/
│   └── ChatContext.tsx           # ✅ State management + unread
├── services/
│   ├── api.ts                    # ✅ API client
│   ├── socket.ts                 # ✅ WebSocket
│   └── files.ts                  # ✅ File upload utils
└── types/
    └── index.ts                  # ✅ TypeScript types
```

---

## TÍCH HỢP VỚI BACKEND SERVICES

| Frontend Feature | Backend Service | API Endpoint | Status |
|------------------|-----------------|--------------|--------|
| File Upload | file-storage | POST /files/presigned-url | ✅ Done |
| File Confirm | file-storage | POST /files/confirm-upload | ✅ Done |
| File Download | file-storage | POST /files/presigned-get-url | ✅ Done |
| Reactions | chat-service | POST/DELETE /messages/:id/reactions | ✅ Done |
| Edit Message | chat-service | PUT /messages/:id | ✅ Done |
| Delete Message | chat-service | DELETE /messages/:id | ✅ Done |
| Pin Message | chat-service | POST/DELETE /messages/:id/pin | ✅ Done |
| Unread Counts | chat-service | GET /notifications/unread | ✅ Done |
| Mark as Read | chat-service | POST /notifications/read/:roomId | ✅ Done |
| Search Messages | chat-service | GET /messages/search | ✅ Done |
| AI Summarize | ai-service | POST /ai/rooms/:roomId/summarize | ✅ Done |
| AI Action Items | ai-service | POST /ai/rooms/:roomId/action-items | ✅ Done |
| AI Q&A | ai-service | POST /ai/rooms/:roomId/query | ✅ Done |
| AI Doc Summary | ai-service | POST /ai/documents/:attachmentId/summarize | ⚠️ API Ready |

---

## GHI CHÚ

1. **Sprint 4 đã hoàn thành:**
   - Message interactions (reactions, edit, delete, pin)
   - File upload và hiển thị
   - File preview (inline + fullscreen) cho Image và PDF
   - Unread count tracking
   - Rich text editor với mentions

2. **Sprint 5 đã hoàn thành:**
   - Channel management (edit, delete, archive)
   - Leave channel functionality
   - ChannelSettingsDropdown với hover menu
   - Confirmation modals cho các actions

3. **Sprint 6 đã hoàn thành:**
   - Search (UC10) với full-text search, filters, keyboard shortcut
   - AI Summarize (UC11) - tóm tắt hội thoại
   - AI Action Items (UC12) - trích xuất action items
   - AI Q&A (UC13) - hỏi đáp theo ngữ cảnh RAG
   - AI Settings với sub-tabs (Assistant | Settings)

4. **Tiếp theo cần làm:**
   - UC14 - Document Summary (thêm UI button vào FileAttachment)
   - UC02 - Member management (invite, remove, roles)

5. **Technical notes:**
   - File preview modals sử dụng React Portal để đảm bảo z-index
   - ESC key để đóng modals
   - Compact mode cho multiple files với flex-wrap layout
   - Presigned URLs được fetch on-demand cho file download
   - Channel dropdown hiển thị khi hover vào channel item
   - isOwner check để hiển thị/ẩn các options (edit, delete, archive)
   - Backend permission check: `member.role === 'ADMIN' || room.createdBy === userId || isOrgOwner`
   - Creator tự động được thêm với role ADMIN khi tạo channel
   - Org owner (user có role "OWNER") có quyền admin trên tất cả channels trong workspace
   - AI Settings Tab có 2 sub-tabs: Assistant (use AI) và Settings (configure AI)
   - AI features mặc định disabled, chỉ OWNER/ADMIN mới có quyền enable
   - Search sử dụng PostgreSQL tsvector với debounced input (300ms)
