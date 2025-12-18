"use client";

import { AIActionButtons } from "./ai-action-buttons";

/**
 * 🎨 DEMO Component - AI Action Buttons với Animation Đẳng Cấp
 *
 * Features:
 * ✨ Shimmer effect - gradient chạy qua button
 * 💫 Pulse glow - button "thở" với shadow đẹp mắt
 * 🌀 Spin effect - icon xoay chậm rãi
 * 📝 Streaming text - text xuất hiện từ từ như ChatGPT
 * ⚡ Blinking cursor - cursor nhấp nháy khi đang stream
 * 🎯 Loading messages - text xoay vòng mỗi 1.5s
 */
export const AIActionButtonsDemo = () => {
  // Simulate AI API calls với delay để demo animation
  const handleRefine = async (): Promise<string> => {
    console.log("🎨 AI Refine started...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return "Đã refine issue description thành công! AI đã cải thiện mô tả để rõ ràng và chi tiết hơn, bổ sung thêm context và acceptance criteria.";
  };

  const handleEstimate = async (): Promise<string> => {
    console.log("📊 AI Estimate started...");
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return "Ước tính story points: 5 điểm. Dựa trên độ phức tạp, scope công việc, và team velocity trung bình.";
  };

  const handleBreakdown = async (): Promise<string> => {
    console.log("⚡ AI Breakdown started...");
    await new Promise((resolve) => setTimeout(resolve, 4000));
    return "Đã tạo 3 subtasks thành công: 1) Thiết kế UI components và mockups, 2) Implement API integration với backend, 3) Write comprehensive unit tests và documentation.";
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-custom-text-100 flex items-center justify-center gap-3">
          ✨ AI Action Buttons Demo
        </h1>
        <p className="text-custom-text-300 text-lg">
          Click any button to experience the stunning animations! 🚀
        </p>
      </div>

      {/* Component Demo */}
      <div className="border border-custom-border-200 rounded-xl p-6 bg-custom-background-100 shadow-lg">
        <AIActionButtons
          onRefine={handleRefine}
          onEstimate={handleEstimate}
          onBreakdown={handleBreakdown}
        />
      </div>

      {/* Features List */}
      <div className="border-t border-custom-border-200 pt-8 space-y-6">
        <h2 className="text-xl font-semibold text-custom-text-100 mb-4">
          ⚡ Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
            <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
              ✨ Shimmer Effect
            </h3>
            <p className="text-sm text-custom-text-300">
              Gradient animation chạy qua button khi loading - creates a premium feel
            </p>
          </div>

          <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
            <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
              💫 Pulse Glow
            </h3>
            <p className="text-sm text-custom-text-300">
              Button "breathing" với glow effect - đặc biệt đẹp trên AI Breakdown
            </p>
          </div>

          <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
            <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
              🔄 Cycling Messages
            </h3>
            <p className="text-sm text-custom-text-300">
              Loading text tự động xoay vòng: Generating → Thinking → Manifesting...
            </p>
          </div>

          <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
            <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
              📝 Streaming Text
            </h3>
            <p className="text-sm text-custom-text-300">
              Text xuất hiện từ từ như ChatGPT với blinking cursor effect
            </p>
          </div>

          <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
            <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
              🎨 Gradient Themes
            </h3>
            <p className="text-sm text-custom-text-300">
              Refine (purple), Estimate (blue), Breakdown (orange) - mỗi button một style riêng
            </p>
          </div>

          <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
            <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
              🚫 Smart State
            </h3>
            <p className="text-sm text-custom-text-300">
              Ngăn multiple API calls cùng lúc - chỉ 1 action được chạy tại 1 thời điểm
            </p>
          </div>
        </div>
      </div>

      {/* Usage Example */}
      <div className="border-t border-custom-border-200 pt-8">
        <h2 className="text-xl font-semibold text-custom-text-100 mb-4">
          💻 Usage Example
        </h2>
        <pre className="p-4 bg-custom-background-90 rounded-lg overflow-x-auto text-sm">
{`import { AIActionButtons } from "@/core/components/issue/ai-action-buttons";

export const IssueDetailPanel = () => {
  const handleRefine = async () => {
    const response = await fetch("/api/ai/refine", {
      method: "POST",
      body: JSON.stringify({ issueId }),
    });
    const data = await response.json();
    return data.message;
  };

  return (
    <AIActionButtons
      onRefine={handleRefine}
      onEstimate={handleEstimate}
      onBreakdown={handleBreakdown}
    />
  );
};`}
        </pre>
      </div>

      {/* Animation Details */}
      <div className="border-t border-custom-border-200 pt-8">
        <h2 className="text-xl font-semibold text-custom-text-100 mb-4">
          🎬 Animation Timeline
        </h2>
        <div className="space-y-3 text-sm text-custom-text-300">
          <div className="flex items-start gap-3">
            <span className="font-mono text-custom-text-400">0.0s</span>
            <span>User clicks button → Button state changes to loading</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-custom-text-400">0.0s</span>
            <span>Shimmer effect starts → Gradient animation begins</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-custom-text-400">1.5s</span>
            <span>First message cycle → "Generating..." → "Thinking..."</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-custom-text-400">3.0s</span>
            <span>API response received → Loading state ends</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-custom-text-400">3.0s</span>
            <span>Streaming starts → Text appears word by word (50ms/word)</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-custom-text-400">5.0s</span>
            <span>Streaming complete → Message auto-dismisses after 5s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
