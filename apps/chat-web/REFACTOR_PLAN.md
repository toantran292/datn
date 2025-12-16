# Chat-Web Refactor Plan

Kế hoạch refactor toàn diện cho chat-web dựa trên mockup thiết kế và Feature Analysis.

**Ngày tạo:** 2024-12-16
**Cập nhật lần cuối:** 2024-12-16 (Folder Restructure Complete)

---

## TIẾN ĐỘ TỔNG QUAN

| Phase | Trạng thái | Hoàn thành |
|-------|------------|------------|
| Phase 1: UI Refactor | ✅ Hoàn thành | 100% |
| Phase 2: Component Structure | ✅ Hoàn thành | 100% |
| Phase 3: Implementation Tasks | 🔄 Đang tiến hành | 90% |
| Phase 4: Styling | ✅ Hoàn thành | 100% |
| Phase 5: Future Enhancements | ⏳ Chưa bắt đầu | 0% |

---

## MỤC TIÊU

1. **UI/UX cải tiến** - Giao diện giống mockup (Slack-like)
2. **Tích hợp AppHeader** - Sử dụng shared header từ design-system
3. **Code structure** - Tổ chức code tốt hơn, dễ maintain
4. **Feature completion** - Hoàn thiện các UC còn thiếu

---

## PHASE 1: UI REFACTOR (Ưu tiên cao)

### 1.1 Layout Structure

**Hiện tại:**
```
┌─────────────────────────────────────────┐
│ (No header)                             │
├──────────┬──────────────────┬───────────┤
│ Sidebar  │    ChatWindow    │  Details  │
│ (basic)  │                  │           │
└──────────┴──────────────────┴───────────┘
```

**Mục tiêu:**
```
┌─────────────────────────────────────────┐
│            AppHeader                     │
├──────────┬──────────────────┬───────────┤
│ Sidebar  │    ChatWindow    │  Details  │
│ (3 cats) │   (improved)     │  (tabs)   │
└──────────┴──────────────────┴───────────┘
```

### 1.2 Sidebar Refactor

**Cấu trúc mới (3 categories):**
```
WORKSPACE
  # general
  # announcements
  # random

PROJECT: {Project Name}
  # frontend
  # backend
  # qa

DIRECT MESSAGES
  @ User 1
  @ User 2
```

**Bỏ đi:**
- Logo workspace (đã có trong AppHeader)
- User profile ở footer (đã có trong AppHeader)
- Home, Activity, Files, Later links (không cần thiết)

**Thêm mới:**
- Unread badge (số tin chưa đọc)
- Online indicator cho DMs
- Collapsible categories

### 1.3 Chat Window Refactor

**Header cải tiến:**
```
┌─────────────────────────────────────────┐
│ # channel-name   [Project: Name]   🔍 👥│
└─────────────────────────────────────────┘
```

**Message Display:**
- Avatar với initials/colors
- Tên người gửi + timestamp
- Reactions display
- Thread reply count
- Hover actions toolbar

**Message Input:**
- Attachment button (📎)
- Emoji picker (😊)
- Mention (@)
- Video call button (optional)
- Send button

### 1.4 Right Sidebar (Channel Details)

**Tabs:**
1. **Threads** - Active threads in channel
2. **Members** - Channel members list
3. **Files** - Shared files

---

## PHASE 2: COMPONENT STRUCTURE

### 2.1 New Component Tree

```
src/
├── app/
│   ├── layout.tsx              # Root layout với AppHeader
│   ├── MainLayout.tsx          # Chat-specific layout
│   └── (chat)/
│       └── page.tsx            # Main chat page
│
├── components/
│   ├── layout/
│   │   ├── ChatLayout.tsx      # Main 3-column layout
│   │   └── index.ts
│   │
│   ├── sidebar/                # LEFT SIDEBAR
│   │   ├── Sidebar.tsx         # Main sidebar container
│   │   ├── SidebarCategory.tsx # Collapsible category
│   │   ├── ChannelItem.tsx     # Channel list item
│   │   ├── DMItem.tsx          # DM list item
│   │   ├── UnreadBadge.tsx     # Unread count badge
│   │   └── index.ts
│   │
│   ├── chat/                   # CHAT WINDOW
│   │   ├── ChatWindow.tsx      # Main chat area
│   │   ├── ChatHeader.tsx      # Channel header
│   │   ├── MessageList.tsx     # Messages container
│   │   ├── MessageItem.tsx     # Single message
│   │   ├── MessageInput.tsx    # Input area
│   │   ├── MessageActions.tsx  # Hover toolbar
│   │   ├── Avatar.tsx          # User avatar
│   │   ├── Reactions.tsx       # Emoji reactions
│   │   └── index.ts
│   │
│   ├── details/                # RIGHT SIDEBAR
│   │   ├── DetailsPanel.tsx    # Main container
│   │   ├── ThreadsTab.tsx      # Threads list
│   │   ├── MembersTab.tsx      # Members list
│   │   ├── FilesTab.tsx        # Files list
│   │   ├── ThreadView.tsx      # Thread conversation
│   │   └── index.ts
│   │
│   ├── modals/                 # MODALS
│   │   ├── CreateChannelModal.tsx
│   │   ├── BrowseChannelsModal.tsx
│   │   ├── CreateDMModal.tsx
│   │   ├── ChannelSettingsModal.tsx  # NEW
│   │   └── index.ts
│   │
│   └── shared/                 # SHARED
│       ├── EmojiPicker.tsx     # NEW
│       ├── FileUpload.tsx      # NEW
│       ├── SearchModal.tsx     # NEW (Ctrl+K)
│       └── index.ts
│
├── hooks/
│   ├── use-chat-rooms.ts
│   ├── use-chat-messages.ts
│   ├── use-chat-threads.ts
│   ├── use-chat-sidebar.ts
│   ├── use-chat-modals.ts
│   ├── use-unread.ts           # NEW
│   └── index.ts
│
├── services/
│   ├── api.ts
│   ├── socket.ts
│   └── files.ts                # NEW
│
├── contexts/
│   └── ChatContext.tsx
│
├── types/
│   └── index.ts
│
└── styles/
    └── globals.css
```

---

## PHASE 3: IMPLEMENTATION TASKS

### Sprint 1: Layout & Sidebar (3-4 ngày) ✅ HOÀN THÀNH

- [x] **Task 1.1**: Tích hợp AppHeader vào layout ✅
  - Import từ @design-system/ui
  - Config navigation items
  - Đảm bảo credential flow hoạt động
  - **File:** `src/app/MainLayout.tsx`

- [x] **Task 1.2**: Refactor Sidebar ✅
  - Tạo `Sidebar.tsx` với 3 categories (Project, Workspace, DMs)
  - Component `SidebarCategory` với collapsible
  - Component `ChannelItem` với Hash/Lock icons
  - Component `DMItem` với avatar colors
  - Bỏ logo và user footer
  - Sử dụng Lucide icons
  - **Files:** `src/components/sidebar/`

- [x] **Task 1.3**: Tạo ChatLayout ✅
  - 3-column responsive layout (đã có trong `ChatApp.tsx`)
  - **File:** `src/components/ChatApp.tsx`

### Sprint 2: Chat Window (3-4 ngày) ✅ HOÀN THÀNH

- [x] **Task 2.1**: Refactor ChatHeader ✅
  - Channel name với Hash/Lock icons
  - Search button (placeholder)
  - Info button để toggle sidebar
  - **File:** `src/components/chat/ChatHeader.tsx`

- [x] **Task 2.2**: Refactor MessageItem ✅
  - Avatar component với colors dựa trên user ID
  - Username + timestamp formatting
  - Message content với proper styling
  - Thread reply count với icon
  - Hover actions toolbar
  - **File:** `src/components/chat/MessageItem.tsx`

- [x] **Task 2.3**: Refactor MessageInput ✅
  - Modern rounded input design
  - Send button với disabled state
  - Focus states với ring
  - **File:** `src/components/chat/MessageInput.tsx`

### Sprint 3: Details Panel (2-3 ngày) ✅ HOÀN THÀNH

- [x] **Task 3.1**: Refactor DetailsPanel ✅
  - Tab navigation với Lucide icons (Thread, Members, Files)
  - Modern tab styling với active state
  - **File:** `src/components/details/DetailsPanel.tsx`

- [x] **Task 3.2**: Improve ThreadsTab ✅
  - Thread view với parent message highlight
  - Reply input với textarea
  - Avatar components
  - **File:** `src/components/details/ThreadView.tsx`

- [x] **Task 3.3**: Improve MembersTab ✅
  - Member list với avatars
  - Online status indicator
  - Add member button (placeholder)
  - **File:** `src/components/details/MembersTab.tsx`

- [x] **Task 3.4**: Improve FilesTab ✅
  - File list với type-specific icons
  - Download button
  - Upload button (placeholder)
  - **File:** `src/components/details/FilesTab.tsx`

### Sprint 4: Features (4-5 ngày) ⏳ CHƯA BẮT ĐẦU

- [ ] **Task 4.1**: Emoji Reactions
  - EmojiPicker component
  - Add/remove reactions
  - Reactions display

- [ ] **Task 4.2**: Message Actions
  - Edit message
  - Delete message
  - Pin message

- [ ] **Task 4.3**: File Upload (basic)
  - Upload button
  - File preview
  - File message display

- [ ] **Task 4.4**: Unread Count
  - Track last read
  - Badge display
  - Mark as read

---

## PHASE 4: STYLING

### Color Palette (từ mockup)

```css
:root {
  /* Background */
  --bg-sidebar: #1a1d21;
  --bg-main: #ffffff;
  --bg-hover: #f8f8f8;

  /* Text */
  --text-primary: #1d1c1d;
  --text-secondary: #616061;
  --text-muted: #868686;

  /* Accent */
  --accent-primary: #007a5a;  /* Green for online */
  --accent-blue: #1264a3;     /* Links, buttons */
  --accent-purple: #4a154b;   /* Project badge */

  /* Borders */
  --border-light: #e8e8e8;

  /* Messages */
  --msg-own: #e8f5e9;
  --msg-other: #f5f5f5;
}
```

### Typography

```css
/* Channel name */
.channel-name {
  font-size: 18px;
  font-weight: 700;
}

/* Message sender */
.sender-name {
  font-size: 15px;
  font-weight: 700;
}

/* Message content */
.message-content {
  font-size: 15px;
  line-height: 1.46;
}

/* Timestamp */
.timestamp {
  font-size: 12px;
  color: var(--text-muted);
}
```

---

## PHASE 5: FUTURE ENHANCEMENTS

### AI Features (sau khi hoàn thành cơ bản)

1. **AI Tab trong Details Panel**
   - Summarize conversation
   - Extract action items
   - Q&A

2. **Message AI Actions**
   - "Summarize thread"
   - "Translate message"

### Search (Ctrl+K)

1. **SearchModal component**
2. **Backend search API**
3. **Result highlighting**

### Notifications

1. **Browser notifications**
2. **Sound notifications**
3. **Notification preferences**

---

## DEPENDENCIES

### Cần từ design-system

```typescript
import {
  AppHeader,
  useAppHeaderContext,  // ✅ Đã sử dụng
} from '@design-system/ui';
```

### Đã cài đặt ✅

```bash
pnpm add lucide-react@^0.469.0  # Icons - ĐÃ CÀI
```

### Cần cài thêm (cho Sprint 4)

```bash
pnpm add @emoji-mart/react @emoji-mart/data  # Emoji picker
pnpm add date-fns                             # Date formatting
pnpm add react-dropzone                       # File upload
```

---

## TIMELINE ƯỚC TÍNH

| Phase | Thời gian | Mô tả |
|-------|-----------|-------|
| Phase 1 | 3-4 ngày | Layout & Sidebar |
| Phase 2 | 3-4 ngày | Chat Window |
| Phase 3 | 2-3 ngày | Details Panel |
| Phase 4 | 4-5 ngày | Features |
| **TỔNG** | **12-16 ngày** | |

---

## CHECKLIST TRƯỚC KHI BẮT ĐẦU

- [x] Đảm bảo design-system có đủ components cần thiết ✅
- [x] Verify AppHeader hoạt động với chat-web ✅
- [x] Test credential flow giữa các apps ✅
- [x] Setup Tailwind CSS (nếu chưa có) ✅
- [ ] Review mockup với team

---

## GHI CHÚ

1. **Giữ nguyên logic credential** - Không thay đổi auth flow ✅
2. **Incremental refactor** - Từng phần một, không break existing features ✅
3. **Mobile responsive** - Sidebar collapsible trên mobile (cần thêm)
4. **Accessibility** - Keyboard navigation, ARIA labels (cần thêm)

---

## CHANGELOG

### 2024-12-16 - UI Refactor Initial

**Đã hoàn thành:**
- ✅ Tích hợp AppHeader từ design-system
- ✅ Refactor Left Sidebar với 3 categories collapsible
- ✅ Refactor ChatWindow với modern Slack-like design
- ✅ Refactor Right Sidebar (RightSidebar, ThreadView, MembersTab, FilesTab)
- ✅ Thêm lucide-react cho icons
- ✅ Áp dụng Tailwind CSS với custom CSS variables

**Files đã thay đổi:**
- `src/components/left-sidebar/RoomsList.tsx` - Complete rewrite
- `src/components/main/ChatWindow.tsx` - Complete rewrite
- `src/components/right-sidebar/RightSidebar.tsx` - Refactored
- `src/components/right-sidebar/ThreadView.tsx` - Refactored
- `src/components/right-sidebar/MembersTab.tsx` - Refactored
- `src/components/right-sidebar/FilesTab.tsx` - Refactored
- `package.json` - Added lucide-react dependency

### 2024-12-16 - Modal Refactor (Design System Integration)

**Đã hoàn thành:**
- ✅ Refactor CreateChannelModal - Sử dụng ModalCore, Button, Input từ @uts/design-system/ui
- ✅ Refactor BrowseChannelsModal - Sử dụng ModalCore, Button, Input từ @uts/design-system/ui
- ✅ Refactor CreateDMModal - Sử dụng ModalCore, Button, Input từ @uts/design-system/ui
- ✅ Cải thiện UX với loading states, avatars, và modern styling
- ✅ Thêm prop `isOpen` để kiểm soát modal visibility
- ✅ Sử dụng Tailwind CSS custom variables (custom-text-*, custom-background-*, custom-border-*, custom-primary-*)

**Files đã thay đổi:**
- `src/components/left-sidebar/components/CreateChannelModal.tsx` - Complete rewrite
- `src/components/left-sidebar/components/BrowseChannelsModal.tsx` - Complete rewrite
- `src/components/left-sidebar/components/CreateDMModal.tsx` - Complete rewrite
- `src/components/ChatApp.tsx` - Updated modal usage with `isOpen` prop

**Còn lại cho Sprint 4:**
- Emoji Reactions
- Message Actions (Edit/Delete/Pin)
- File Upload
- Unread Count

### 2024-12-16 - Folder Restructure (Phase 2 Complete)

**Đã hoàn thành:**
- ✅ Restructure folder theo Phase 2 Component Structure
- ✅ Tạo cấu trúc mới với barrel exports (index.ts)
- ✅ Di chuyển sidebar components vào `src/components/sidebar/`
- ✅ Di chuyển chat components vào `src/components/chat/`
- ✅ Di chuyển details components vào `src/components/details/`
- ✅ Di chuyển modals vào `src/components/modals/`
- ✅ Tạo layout component trong `src/components/layout/`
- ✅ Cập nhật tất cả imports
- ✅ Rename SidebarTab → DetailsTab trong ChatContext
- ✅ TypeScript check passed

**Cấu trúc mới:**
```
src/components/
├── layout/
│   ├── ChatLayout.tsx
│   └── index.ts
├── sidebar/
│   ├── Sidebar.tsx
│   ├── SidebarCategory.tsx
│   ├── ChannelItem.tsx
│   ├── DMItem.tsx
│   └── index.ts
├── chat/
│   ├── ChatWindow.tsx
│   ├── ChatHeader.tsx
│   ├── MessageList.tsx
│   ├── MessageItem.tsx
│   ├── MessageInput.tsx
│   ├── Avatar.tsx
│   └── index.ts
├── details/
│   ├── DetailsPanel.tsx
│   ├── ThreadView.tsx
│   ├── MembersTab.tsx
│   ├── FilesTab.tsx
│   └── index.ts
├── modals/
│   ├── CreateChannelModal.tsx
│   ├── BrowseChannelsModal.tsx
│   ├── CreateDMModal.tsx
│   └── index.ts
├── shared/
│   └── index.ts
└── ChatApp.tsx
```

**Files đã xóa (old structure):**
- `src/components/left-sidebar/` - Entire folder removed
- `src/components/main/` - Entire folder removed
- `src/components/right-sidebar/` - Entire folder removed

**Files đã cập nhật:**
- `src/components/ChatApp.tsx` - Updated imports to use new structure
- `src/contexts/ChatContext.tsx` - Changed SidebarTab to DetailsTab
