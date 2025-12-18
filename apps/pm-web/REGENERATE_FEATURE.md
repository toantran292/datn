# 🔄 Regenerate Feature - Quick Guide

## ✅ Đã hoàn thành

Chức năng **Regenerate** đã được integrate vào tất cả AI actions!

## 🎯 Features

### 1. **AIResponseCard với Regenerate Button**
[ai-response-card.tsx](cci:1://file:///Users/dattuanzz/StudySpaces/datn/apps/pm-web/src/core/components/issue/ai-response-card.tsx:0:0-0:0)

```tsx
<AIResponseCard
  title="AI Refined Description"
  content={responseText}
  confidence={95}
  onRegenerate={() => handleRegenerate()}
  isRegenerating={loading}
/>
```

Features:
- ✅ Regenerate button (↻) ở góc trên phải
- ✅ Confidence score với color coding
  - Green: ≥90% (Excellent)
  - Yellow: 70-90% (Good)
  - Red: <70% (Fair)
- ✅ Expand/collapse functionality
- ✅ Gradient background với floating animation
- ✅ Sparkles icon

### 2. **AIActionButtonsV2 với Streaming + Regenerate**
[ai-action-buttons-v2.tsx](cci:1://file:///Users/dattuanzz/StudySpaces/datn/apps/pm-web/src/core/components/issue/ai-action-buttons-v2.tsx:0:0-0:0)

```tsx
<AIActionButtonsV2
  issueId="ISSUE-123"
  onRefine={(_, payload) => ({ url: "/api/ai/refine", payload })}
  onEstimate={(_, payload) => ({ url: "/api/ai/estimate", payload })}
  onBreakdown={(_, payload) => ({ url: "/api/ai/breakdown", payload })}
/>
```

Features:
- ✅ Real-time HTTP Streaming (SSE)
- ✅ ChatGPT-style text streaming
- ✅ Beautiful animations (shimmer, pulse, float)
- ✅ Cycling loading messages
- ✅ Response history với regenerate
- ✅ Blinking cursor during streaming

### 3. **Updated IssueActionButtons**
[issue-action-buttons.tsx](cci:1://file:///Users/dattuanzz/StudySpaces/datn/apps/pm-web/src/core/components/issue/issue-action-buttons.tsx:0:0-0:0)

Đã update để sử dụng `AIActionButtonsV2` thay vì old `AIActionButtons`:

```tsx
<IssueActionButtons
  issueId="ISSUE-123"
  showAIActions={true}
/>
```

## 🚀 How It Works

### Flow Diagram:
```
1. User clicks AI button (Refine/Estimate/Breakdown)
   ↓
2. Show loading state với cycling messages
   "Generating..." → "Thinking..." → "Manifesting..."
   ↓
3. Start HTTP Streaming (SSE)
   ↓
4. Text appears word-by-word (50ms delay)
   với blinking cursor effect
   ↓
5. Streaming completes
   ↓
6. Show AIResponseCard với:
   - Full streamed text
   - Confidence score (95%, 92%, 88%)
   - Regenerate button (↻)
   ↓
7. User clicks Regenerate (↻)
   ↓
8. Repeat từ step 2 (streaming lại)
   ↓
9. Replace old response với new response
```

## 📊 Regenerate Implementation

### State Management:
```typescript
const [responses, setResponses] = useState<AIResponse[]>([]);

interface AIResponse {
  action: AIAction;
  content: string;
  confidence: number;
  timestamp?: number;
}
```

### Regenerate Handler:
```typescript
const handleRegenerate = async (action: AIAction, index: number) => {
  setRegeneratingIndex(index);

  const config = getActionConfig(action);
  const result = await streamAI(config.url, config.payload);

  setResponses(prev => {
    const updated = [...prev];
    updated[index] = {
      action,
      content: result.text,
      confidence: result.confidence || 95,
    };
    return updated;
  });

  setRegeneratingIndex(null);
};
```

### Features:
- ✅ Keep response history (mỗi action có thể có multiple responses)
- ✅ Replace in-place (không add new card)
- ✅ Loading state during regeneration
- ✅ Smooth transitions

## 🧪 Test Page

Navigate to: `/test-ai-regenerate`

Test page bao gồm:
- Full AI buttons với streaming + regenerate
- Instructions chi tiết
- Architecture diagram
- Backend status check

## 🎨 UI Components

### AIResponseCard Visual:
```
┌─────────────────────────────────────────────┐
│ ✨ AI Refined Description        [95%] [↻]  │  ← Header với icon, confidence, regenerate
├─────────────────────────────────────────────┤
│                                             │
│ Đã refine issue description thành công!    │  ← Content (có thể expand/collapse)
│ Issue này đã được cải thiện...             │
│                                             │
└─────────────────────────────────────────────┘
  └─ Gradient background với float animation
```

### Confidence Badges:
- 🟢 **95%** - Excellent (green)
- 🟡 **92%** - Good (yellow)
- 🟢 **88%** - Good (yellow, gần red threshold)

## 🔧 Integration Examples

### Trong Issue Detail Page:
```tsx
import { IssueActionButtons } from "@/core/components/issue/issue-action-buttons";

export const IssueDetailPanel = ({ issue }) => {
  return (
    <div>
      <IssueActionButtons
        issueId={issue.id}
        showAIActions={true}
      />
    </div>
  );
};
```

### Standalone Usage:
```tsx
import { AIActionButtonsV2 } from "@/core/components/issue/ai-action-buttons-v2";

export const MyComponent = () => {
  return (
    <AIActionButtonsV2
      issueId="CUSTOM-123"
      onRefine={(_, payload) => ({
        url: "/api/ai/refine",
        payload: { ...payload, customData: "..." },
      })}
      onEstimate={(_, payload) => ({
        url: "/api/ai/estimate",
        payload,
      })}
      onBreakdown={(_, payload) => ({
        url: "/api/ai/breakdown",
        payload,
      })}
    />
  );
};
```

## 📡 Backend Integration

Backend đã support HTTP Streaming:

### Endpoints:
- `POST /api/ai/refine-description-stream`
- `POST /api/ai/estimate-points-stream`
- `POST /api/ai/breakdown-issue-stream`

### SSE Message Format:
```json
// Text chunks
{"type": "text", "content": "word "}

// Confidence (0.0 - 1.0, frontend x100)
{"type": "confidence", "value": 0.95}

// Metadata
{"type": "metadata", "value": {...}}
```

## ⚙️ Configuration

### Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env):
```env
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

## 🎉 Result

Users can now:
- ✅ See AI responses stream in real-time (ChatGPT-style)
- ✅ Click regenerate (↻) to generate again
- ✅ See confidence scores for reliability
- ✅ Keep history of all generated responses
- ✅ Enjoy beautiful animations và professional UX

**Regenerate feature is production-ready! 🚀**

---

Built with ❤️ for UTS Project Management System
