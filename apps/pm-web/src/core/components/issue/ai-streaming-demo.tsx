"use client";

import { AIActionButtonsV2 } from "./ai-action-buttons-v2";

/**
 * 🌊 DEMO Component - AI Streaming với Regenerate
 *
 * Features:
 * ✨ Real-time HTTP Streaming (SSE)
 * 🔄 Regenerate functionality
 * 📊 Confidence scores (95%, 92%, 88%)
 * 💬 ChatGPT-style text streaming
 * 🎨 Beautiful animations
 * 📦 AIResponseCard với expand/collapse
 */
export const AIStreamingDemo = () => {
  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-custom-text-100 flex items-center justify-center gap-3">
          🌊 AI Streaming Demo
        </h1>
        <p className="text-custom-text-300 text-lg">
          Experience real-time streaming like ChatGPT with regenerate functionality! 🚀
        </p>
      </div>

      {/* Component Demo */}
      <div className="border border-custom-border-200 rounded-xl p-6 bg-custom-background-100 shadow-lg">
        <AIActionButtonsV2
          issueId="demo-123"
          onRefine={(url, payload) => ({
            url: "/api/ai/refine",
            payload,
          })}
          onEstimate={(url, payload) => ({
            url: "/api/ai/estimate",
            payload,
          })}
          onBreakdown={(url, payload) => ({
            url: "/api/ai/breakdown",
            payload,
          })}
        />
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
          <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
            🌊 HTTP Streaming
          </h3>
          <p className="text-sm text-custom-text-300">
            Real-time text streaming using Server-Sent Events (SSE). Text xuất hiện từ từ như ChatGPT.
          </p>
        </div>

        <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
          <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
            🔄 Regenerate
          </h3>
          <p className="text-sm text-custom-text-300">
            Click icon ↻ để generate lại response. Keep history of all responses.
          </p>
        </div>

        <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
          <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
            📊 Confidence Score
          </h3>
          <p className="text-sm text-custom-text-300">
            Display độ tin cậy (95%, 92%, 88%) với color-coded badges (green, yellow, red).
          </p>
        </div>

        <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
          <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
            💬 ChatGPT-Style
          </h3>
          <p className="text-sm text-custom-text-300">
            Professional streaming experience với blinking cursor và smooth animations.
          </p>
        </div>

        <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
          <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
            📦 Response Cards
          </h3>
          <p className="text-sm text-custom-text-300">
            AIResponseCard với expand/collapse, sparkles icon, và gradient background.
          </p>
        </div>

        <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
          <h3 className="font-semibold text-custom-text-100 mb-2 flex items-center gap-2">
            🎨 Animations
          </h3>
          <p className="text-sm text-custom-text-300">
            Shimmer, pulse glow, floating animations - tất cả đều mượt mà 60fps.
          </p>
        </div>
      </div>

      {/* How it Works */}
      <div className="border-t border-custom-border-200 pt-8">
        <h2 className="text-xl font-semibold text-custom-text-100 mb-4">
          🔧 How It Works
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-custom-background-90 rounded-lg">
            <h3 className="font-semibold text-custom-text-100 mb-2">1. Click AI Button</h3>
            <p className="text-sm text-custom-text-300">
              Shimmer effect starts, icon pulses, loading message cycles ("Generating..." → "Thinking..." → "Manifesting...")
            </p>
          </div>

          <div className="p-4 bg-custom-background-90 rounded-lg">
            <h3 className="font-semibold text-custom-text-100 mb-2">2. HTTP Streaming Starts</h3>
            <p className="text-sm text-custom-text-300">
              Server sends data chunks via Server-Sent Events. Text appears word-by-word in real-time với blinking cursor.
            </p>
          </div>

          <div className="p-4 bg-custom-background-90 rounded-lg">
            <h3 className="font-semibold text-custom-text-100 mb-2">3. Streaming Complete</h3>
            <p className="text-sm text-custom-text-300">
              Confidence score (95%) is sent. Response is saved to AIResponseCard với expand/collapse functionality.
            </p>
          </div>

          <div className="p-4 bg-custom-background-90 rounded-lg">
            <h3 className="font-semibold text-custom-text-100 mb-2">4. Regenerate</h3>
            <p className="text-sm text-custom-text-300">
              Click ↻ icon to generate again. New response replaces old one, keeping history of all attempts.
            </p>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="border-t border-custom-border-200 pt-8">
        <h2 className="text-xl font-semibold text-custom-text-100 mb-4">
          📡 API Endpoints
        </h2>
        <div className="space-y-2 text-sm font-mono">
          <div className="p-3 bg-custom-background-90 rounded">
            <span className="text-green-600 font-bold">POST</span>{" "}
            <span className="text-custom-text-200">/api/ai/refine</span>
          </div>
          <div className="p-3 bg-custom-background-90 rounded">
            <span className="text-green-600 font-bold">POST</span>{" "}
            <span className="text-custom-text-200">/api/ai/estimate</span>
          </div>
          <div className="p-3 bg-custom-background-90 rounded">
            <span className="text-green-600 font-bold">POST</span>{" "}
            <span className="text-custom-text-200">/api/ai/breakdown</span>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="border-t border-custom-border-200 pt-8">
        <h2 className="text-xl font-semibold text-custom-text-100 mb-4">
          💻 Usage Example
        </h2>
        <pre className="p-4 bg-custom-background-90 rounded-lg overflow-x-auto text-sm">
{`import { AIActionButtonsV2 } from "@/core/components/issue/ai-action-buttons-v2";

export const IssuePanel = ({ issueId }) => {
  return (
    <AIActionButtonsV2
      issueId={issueId}
      onRefine={(url, payload) => ({
        url: "/api/ai/refine",
        payload: { ...payload, issueId },
      })}
      onEstimate={(url, payload) => ({
        url: "/api/ai/estimate",
        payload: { ...payload, issueId },
      })}
      onBreakdown={(url, payload) => ({
        url: "/api/ai/breakdown",
        payload: { ...payload, issueId },
      })}
    />
  );
};`}
        </pre>
      </div>

      {/* Documentation Link */}
      <div className="border-t border-custom-border-200 pt-8 text-center">
        <p className="text-sm text-custom-text-300 mb-4">
          For detailed implementation guide, see:
        </p>
        <code className="px-4 py-2 bg-custom-background-90 rounded text-sm text-custom-text-200">
          /src/core/components/issue/HTTP_STREAMING_GUIDE.md
        </code>
      </div>
    </div>
  );
};
