# AI-Powered Search & Filter

## Overview

Tính năng tìm kiếm và lọc công việc (issues) với khả năng tìm kiếm thông minh sử dụng AI. Được thiết kế với UI/UX hiện đại, mang lại trải nghiệm tìm kiếm nhanh chóng và trực quan.

## User Experience Flow

### 1. Trigger Search Modal
- Người dùng click vào search bar hoặc nhấn phím tắt `Cmd/Ctrl + K`
- Modal search hiện lên với animation mượt mà
- Focus tự động vào ô tìm kiếm

### 2. Search Experience
- **Normal Search**: Tìm kiếm text thông thường (search trong title, description)
- **AI Search**: Toggle switch để bật/tắt AI semantic search
  - Icon AI sparkle ✨ xuất hiện khi bật AI mode
  - Placeholder text thay đổi để hướng dẫn cách search với AI
  - Hiển thị similarity score cho mỗi kết quả

### 3. Filter Panel
- Filters được nhóm theo categories với visual hierarchy rõ ràng:
  - **Quick Filters**: Priority, Type, Status (pills/chips)
  - **Advanced Filters**: Sprint, Date ranges, Story points (collapsible)
- Real-time results update khi apply filters
- Active filters hiển thị dạng chips có thể remove nhanh

### 4. Results Display
- Kết quả hiển thị dạng list với preview
- Highlight từ khóa tìm kiếm
- Quick actions: View, Edit (hover effect)
- Empty state với illustration và gợi ý search

## UI Components Architecture

```
SearchModal (Main Container)
├── SearchHeader
│   ├── SearchInput (with AI toggle)
│   └── KeyboardShortcuts hint
├── FilterSection (Collapsible)
│   ├── QuickFilters (Priority, Type, Status)
│   ├── AdvancedFilters (Sprint, Dates, Points)
│   └── ActiveFiltersBar
├── ResultsSection
│   ├── ResultsHeader (count, sort options)
│   ├── ResultsList
│   │   └── ResultItem[] (with preview)
│   └── EmptyState (when no results)
└── SearchFooter
    └── KeyboardNavigation hints
```

## Technical Implementation

### Frontend Architecture

#### 1. State Management (MobX)
```typescript
class SearchStore {
  // Search state
  query: string = "";
  useAI: boolean = false;

  // Filter state
  activeFilters: IssueFilter = {};

  // Results state
  results: IIssue[] = [];
  isLoading: boolean = false;

  // UI state
  isModalOpen: boolean = false;
  selectedIndex: number = 0;
}
```

#### 2. API Integration
```typescript
// Normal search endpoint
GET /api/projects/:projectId/issues?search=query

// AI search endpoint
GET /api/projects/:projectId/issues?search=query&useAI=true

// Combined with filters
GET /api/projects/:projectId/issues?search=query&useAI=true&priorities=HIGH,CRITICAL&types=BUG
```

#### 3. Components
- `SearchModal.tsx` - Main modal container
- `SearchInput.tsx` - Search input với AI toggle
- `FilterPanel.tsx` - Collapsible filter panel
- `ResultsList.tsx` - Results display với virtual scrolling
- `ResultItem.tsx` - Individual result card
- `EmptyState.tsx` - No results state

### Backend Architecture

#### 1. Search Service Enhancement
```typescript
class IssueService {
  async searchIssues(params: SearchParams): Promise<SearchResults> {
    if (params.useAI) {
      // AI Semantic Search via RAG
      return this.aiSemanticSearch(params);
    }
    // Normal text search
    return this.textSearch(params);
  }

  private async aiSemanticSearch(params: SearchParams) {
    // 1. Generate query embedding
    const embedding = await ragService.generateEmbedding(params.query);

    // 2. Vector similarity search
    const similarIssues = await ragService.findSimilarIssues({
      embedding,
      projectId: params.projectId,
      threshold: 0.7,
      limit: 50
    });

    // 3. Apply additional filters
    return this.applyFilters(similarIssues, params.filters);
  }
}
```

#### 2. Database Optimization
```sql
-- Index cho text search
CREATE INDEX idx_issue_search ON "Issue"
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Index cho filters
CREATE INDEX idx_issue_filters ON "Issue" (priority, type, "statusId", "projectId");
```

## Features

### Core Features
1. ✅ **Global Search Modal** - Accessible từ anywhere với keyboard shortcut
2. ✅ **AI Semantic Search** - Tìm kiếm dựa trên ý nghĩa, không chỉ từ khóa
3. ✅ **Multi-dimension Filters** - Filter theo priority, type, status, sprint, dates
4. ✅ **Real-time Results** - Debounced search với instant feedback
5. ✅ **Keyboard Navigation** - Arrow keys, Enter, Escape support

### Advanced Features
1. ✅ **Search History** - Recently searched queries
2. ✅ **Saved Searches** - Save frequent search + filter combinations
3. ✅ **Smart Suggestions** - Auto-complete based on issue titles
4. ✅ **Similarity Score** - Show relevance % for AI results
5. ✅ **Export Results** - Export filtered issues to CSV/JSON

### UI/UX Highlights
1. **Glassmorphism Design** - Modern frosted glass effect
2. **Smooth Animations** - Framer Motion for transitions
3. **Dark Mode Support** - Seamless dark/light theme
4. **Responsive** - Mobile-friendly modal
5. **Accessibility** - ARIA labels, keyboard navigation

## AI Search Capabilities

### What AI Search Can Do
1. **Semantic Understanding**
   - "database performance issues" → finds issues about slow queries, optimization, indexing
   - "user can't login" → finds authentication, session, credential issues
   - "broken UI layout" → finds CSS, responsive, styling issues

2. **Context-Aware**
   - Understands technical jargon
   - Recognizes problem patterns
   - Links related concepts

3. **Fuzzy Matching**
   - Typo tolerance
   - Synonym recognition
   - Multi-language support (Vietnamese ↔ English)

### Example Queries
| Query | AI Understands |
|-------|----------------|
| "payment failed" | Payment processing errors, transaction failures, billing issues |
| "slow page load" | Performance problems, optimization needs, loading delays |
| "crash on mobile" | Mobile app crashes, device-specific bugs, platform issues |
| "security concern" | Authentication, authorization, data leaks, vulnerabilities |

## Performance Optimization

### Frontend
1. **Debounced Search** - 300ms delay để tránh quá nhiều requests
2. **Virtual Scrolling** - Render only visible results (react-window)
3. **Lazy Loading** - Load filters data on demand
4. **Memoization** - React.memo cho components, useMemo cho computed values

### Backend
1. **Query Caching** - Redis cache cho frequent searches (TTL: 5 minutes)
2. **Database Indexing** - Optimized indexes cho search và filters
3. **Pagination** - Limit results per page (default: 50)
4. **Connection Pooling** - Prisma connection pool optimization

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search modal |
| `Escape` | Close modal |
| `↑` / `↓` | Navigate results |
| `Enter` | Open selected issue |
| `Cmd/Ctrl + ↑` | Toggle AI mode |
| `Cmd/Ctrl + F` | Focus filters |

## Implementation Plan

### Phase 1: Core Search Modal ✅
- [ ] Design modal UI với Figma mockup
- [ ] Implement SearchModal component
- [ ] Add keyboard shortcut listener
- [ ] Integrate with backend API

### Phase 2: AI Integration ✅
- [ ] Backend: Enhance RAG service
- [ ] Backend: AI search endpoint
- [ ] Frontend: AI toggle UI
- [ ] Frontend: Similarity score display

### Phase 3: Advanced Filters ✅
- [ ] Multi-select filter UI
- [ ] Filter combinations logic
- [ ] Active filters display
- [ ] Clear filters functionality

### Phase 4: Polish & Optimize ✅
- [ ] Animation & transitions
- [ ] Empty states & loading states
- [ ] Error handling & retry
- [ ] Performance testing

## Design System

### Colors
```scss
// AI Mode
--ai-primary: #8B5CF6;      // Purple
--ai-glow: rgba(139, 92, 246, 0.3);

// Search
--search-bg: rgba(255, 255, 255, 0.8);
--search-border: #E5E7EB;
--search-focus: #3B82F6;

// Results
--result-hover: #F9FAFB;
--result-selected: #EFF6FF;
```

### Typography
```scss
// Search Input
font-size: 16px;
font-weight: 500;

// Result Title
font-size: 14px;
font-weight: 600;

// Result Preview
font-size: 12px;
color: #6B7280;
```

### Spacing
- Modal padding: 24px
- Section gap: 20px
- Item gap: 12px
- Chip gap: 8px

## Accessibility

1. **ARIA Labels**
   - `role="dialog"` for modal
   - `aria-label` for all interactive elements
   - `aria-describedby` for search hints

2. **Focus Management**
   - Trap focus inside modal
   - Restore focus on close
   - Visible focus indicators

3. **Screen Reader Support**
   - Announce results count
   - Announce filter changes
   - Describe AI mode status

## Testing Strategy

### Unit Tests
- Search store actions
- Filter logic
- AI toggle functionality

### Integration Tests
- API endpoints
- Search + filters combined
- Error scenarios

### E2E Tests
- Open modal with shortcut
- Search and select result
- Apply filters and clear
- AI search flow

## Future Enhancements

1. **Natural Language Processing**
   - "show me bugs assigned to John due this week"
   - "find critical issues created yesterday"

2. **Search Analytics**
   - Track popular searches
   - Measure AI vs normal usage
   - Identify search gaps

3. **Collaborative Search**
   - Share search URLs
   - Team search history
   - Saved team searches

4. **Voice Search**
   - Voice input support
   - Voice command filters

## Success Metrics

1. **Usage Metrics**
   - Search modal open rate
   - AI toggle usage rate
   - Average search time

2. **Performance Metrics**
   - Search response time < 200ms
   - AI search response time < 500ms
   - Modal open animation < 300ms

3. **Quality Metrics**
   - Search success rate (clicked result)
   - AI relevance score > 0.7
   - User satisfaction (feedback)
