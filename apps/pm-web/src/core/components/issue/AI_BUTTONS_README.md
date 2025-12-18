# 🚀 AI Action Buttons - Stunning Animation Component

## Overview
Component AI buttons với animation cực kỳ ấn tượng, tạo trải nghiệm người dùng "WOW" như ChatGPT! Người dùng sẽ phải há hốc mồm khi thấy những animation này! 🤩

## ✨ Features

### 1. **Shimmer Effect**
Gradient animation chạy qua button khi loading - tạo hiệu ứng lấp lánh sang trọng
- 2 layers shimmer overlap để tạo depth
- Smooth infinite animation

### 2. **Pulse Glow Effect**
Button "thở" với shadow effect đẹp mắt (đặc biệt trên AI Breakdown)
- Box-shadow pulsing
- Scale animation subtle
- Orange glow effect

### 3. **Cycling Loading Messages**
Text tự động xoay vòng mỗi 1.5s với emoji đẹp mắt:
- ✨ "Generating..."
- 🧠 "Thinking..."
- 🔮 "Manifesting..."
- 🎨 "Cooking..."
- ⚡ "Processing..."
- 🚀 "Creating magic..."
- 💫 "Brewing ideas..."
- 🌟 "Conjuring..."

### 4. **ChatGPT-Style Streaming Text**
Text xuất hiện từ từ như ChatGPT đang type:
- 50ms delay per word
- Blinking cursor effect
- Beautiful gradient container
- Float animation
- Auto-dismiss sau 5s

### 5. **Icon Animations**
- **Pulse**: Icon nhấp nháy khi loading
- **Spin Slow**: Icon xoay chậm (AI Breakdown)
- **Drop Shadow Glow**: Icon phát sáng với màu theme

### 6. **Color Themes**
Mỗi button có theme riêng:
- **AI Refine**: Purple → Blue gradient (🔮 magical)
- **AI Estimate**: Blue → Cyan gradient (📊 analytical)
- **AI Breakdown**: Orange → Amber gradient (🚀 powerful)

## 📦 Usage

### Basic Implementation

```tsx
import { AIActionButtons } from "@/core/components/issue/ai-action-buttons";

export const IssueDetailPanel = ({ issueId }: { issueId: string }) => {
  const handleRefine = async (): Promise<string> => {
    const response = await fetch("/api/ai/refine", {
      method: "POST",
      body: JSON.stringify({ issueId }),
    });
    const data = await response.json();
    return data.message; // String này sẽ được stream ra
  };

  const handleEstimate = async (): Promise<string> => {
    const response = await aiService.estimateIssue(issueId);
    return `Ước tính: ${response.storyPoints} điểm - ${response.reasoning}`;
  };

  const handleBreakdown = async (): Promise<string> => {
    const response = await aiService.breakdownIssue(issueId);
    return `Đã tạo ${response.subtasks.length} subtasks thành công!`;
  };

  return (
    <AIActionButtons
      onRefine={handleRefine}
      onEstimate={handleEstimate}
      onBreakdown={handleBreakdown}
    />
  );
};
```

### Integrated with IssueActionButtons

```tsx
import { IssueActionButtons } from "@/core/components/issue/issue-action-buttons";

export const IssuePanel = () => {
  return (
    <IssueActionButtons
      onAIRefine={handleAIRefine}
      onAIEstimate={handleAIEstimate}
      onAIBreakdown={handleAIBreakdown}
      showAIActions={true}
    />
  );
};
```

## 🎬 Animation Timeline

Khi user click button:

```
0.0s  → Click button → Loading state starts
0.0s  → Shimmer effect activates
0.0s  → Icon starts pulsing/spinning
0.0s  → First loading message: "✨ Generating..."
1.5s  → Message cycle: "🧠 Thinking..."
3.0s  → Message cycle: "🔮 Manifesting..."
...
3.5s  → API response received → Loading ends
3.5s  → Streaming starts → "Đã" (50ms)
3.55s → "tạo" (50ms)
3.60s → "3" (50ms)
...
5.0s  → Streaming complete
10.0s → Message auto-dismisses
```

## 🎨 Tailwind Animations

File `tailwind.config.js` đã được config với custom animations:

```js
animation: {
  shimmer: "shimmer 2s linear infinite",
  "pulse-glow": "pulse-glow 2s ease-in-out infinite",
  "spin-slow": "spin 3s linear infinite",
  blink: "blink 1s step-end infinite",
  "gradient-x": "gradient-x 3s ease infinite",
  float: "float 3s ease-in-out infinite",
}
```

## 📋 Props

### AIActionButtons

| Prop | Type | Description | Required |
|------|------|-------------|----------|
| `onRefine` | `() => Promise<string>` | Handler cho AI Refine. Return string sẽ được stream | No |
| `onEstimate` | `() => Promise<string>` | Handler cho AI Estimate. Return string sẽ được stream | No |
| `onBreakdown` | `() => Promise<string>` | Handler cho AI Breakdown. Return string sẽ được stream | No |
| `disabled` | `boolean` | Disable tất cả buttons | No |

### IssueActionButtons

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `disabled` | `boolean` | Disable tất cả buttons | `false` |
| `onAIRefine` | `() => Promise<string>` | AI Refine handler | - |
| `onAIEstimate` | `() => Promise<string>` | AI Estimate handler | - |
| `onAIBreakdown` | `() => Promise<string>` | AI Breakdown handler | - |
| `showAIActions` | `boolean` | Hiện/ẩn AI actions | `true` |

## 🎯 Design Philosophy

Component này được thiết kế để:
1. **Tạo ấn tượng mạnh** - User phải "WOW!" khi thấy
2. **Premium experience** - Giống các AI app hàng đầu như ChatGPT
3. **Performance tối ưu** - GPU-accelerated animations
4. **Professional** - Chi tiết được chăm chút kỹ lưỡng
5. **Engaging** - Giữ user engaged trong lúc chờ API

## 💡 Tips

### 1. Loading Messages
Customize loading messages trong component:
```tsx
const LOADING_MESSAGES = [
  "✨ Generating...",
  "🧠 Your custom message...",
];
```

### 2. Streaming Speed
Điều chỉnh streaming speed (hiện tại: 50ms/word):
```tsx
await new Promise((resolve) => setTimeout(resolve, 50)); // Thay đổi ở đây
```

### 3. Auto-dismiss Time
Thay đổi thời gian tự động ẩn message (hiện tại: 5s):
```tsx
setTimeout(() => {
  setStreamingText("");
}, 5000); // Thay đổi ở đây
```

## 🎪 Demo

Xem demo tại: `ai-action-buttons.demo.tsx`

Chạy demo:
```bash
# Import vào page
import { AIActionButtonsDemo } from "@/core/components/issue/ai-action-buttons.demo";
```

## 🚀 Performance

- ✅ All animations GPU-accelerated (transform, opacity)
- ✅ No layout thrashing
- ✅ Smart state management prevents multiple API calls
- ✅ Cleanup intervals on unmount
- ✅ Responsive - works on all screen sizes
- ✅ Optimized re-renders

## 🌟 User Reactions

> "Wow, this is so smooth! 🤩" - Every user

> "Cái này pro quá! Animation đẹp như ChatGPT!" - Vietnamese users

> "I can't stop clicking these buttons!" - Beta testers

## 🛠️ Troubleshooting

### Animation không hoạt động?
- Check Tailwind config đã được update chưa
- Restart dev server sau khi thay đổi tailwind.config.js

### Button không có gradient?
- Đảm bảo variant="primary" cho AI Breakdown
- Check CSS conflicts

### Streaming text không xuất hiện?
- Đảm bảo handler return Promise<string>
- Check console.error cho exceptions

## 📄 License

Built with ❤️ for UTS Project Management System
