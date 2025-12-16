"use client";

import { IssueActionButtons } from "@/core/components/issue/issue-action-buttons";

/**
 * 🧪 Test Page - AI Regenerate Functionality
 *
 * Demonstrates:
 * - Real-time AI streaming (ChatGPT-style)
 * - Regenerate button (↻) for each response
 * - Confidence scores (95%, 92%, 88%)
 * - Beautiful animations
 * - Response history
 */
export default function TestAIRegeneratePage() {
  return (
    <div className="min-h-screen bg-custom-background-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-custom-text-100">
            🌊 AI Regenerate Test
          </h1>
          <p className="text-custom-text-300 text-lg">
            Test chức năng regenerate với real-time streaming!
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-custom-background-90 rounded-lg p-6 border border-custom-border-200">
          <h2 className="text-xl font-semibold text-custom-text-100 mb-4">
            📋 Instructions
          </h2>
          <ol className="space-y-2 text-custom-text-300 list-decimal list-inside">
            <li>Click vào một trong 3 AI buttons (Refine, Estimate, hoặc Breakdown)</li>
            <li>Watch text stream word-by-word như ChatGPT</li>
            <li>Sau khi streaming xong, bạn sẽ thấy:
              <ul className="ml-8 mt-2 list-disc list-inside">
                <li>Response card với gradient background</li>
                <li>Confidence score (95%, 92%, 88%) với color coding</li>
                <li>Regenerate button (↻) ở góc trên phải</li>
              </ul>
            </li>
            <li>Click vào ↻ button để regenerate lại response</li>
            <li>Response mới sẽ replace response cũ với smooth animation</li>
          </ol>
        </div>

        {/* Test Component */}
        <div className="bg-custom-background-100 rounded-xl border border-custom-border-200 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-custom-text-100 mb-4">
            🎯 Test Component
          </h2>
          <IssueActionButtons
            issueId="TEST-AI-123"
            showAIActions={true}
          />
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
            <h3 className="font-semibold text-custom-text-100 mb-2">
              🌊 HTTP Streaming
            </h3>
            <p className="text-sm text-custom-text-300">
              Text xuất hiện từ từ word-by-word như ChatGPT với SSE streaming
            </p>
          </div>

          <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
            <h3 className="font-semibold text-custom-text-100 mb-2">
              🔄 Regenerate
            </h3>
            <p className="text-sm text-custom-text-300">
              Click icon ↻ để generate lại. Keep history của all responses
            </p>
          </div>

          <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
            <h3 className="font-semibold text-custom-text-100 mb-2">
              📊 Confidence Score
            </h3>
            <p className="text-sm text-custom-text-300">
              Display độ tin cậy với color-coded badges: Green (≥90%), Yellow (70-90%), Red (&lt;70%)
            </p>
          </div>
        </div>

        {/* Backend Status */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            Backend Status
          </h3>
          <p className="text-sm text-custom-text-300">
            Ensure backend is running: <code className="px-2 py-1 bg-custom-background-90 rounded">cd services/pm && pnpm dev</code>
          </p>
          <p className="text-sm text-custom-text-300 mt-2">
            Backend URL: <code className="px-2 py-1 bg-custom-background-90 rounded">http://localhost:3001</code>
          </p>
          <p className="text-sm text-custom-text-300 mt-2">
            Required: <code className="px-2 py-1 bg-custom-background-90 rounded">OPENAI_API_KEY</code> in backend .env
          </p>
        </div>

        {/* Architecture */}
        <div className="bg-custom-background-90 rounded-lg p-6 border border-custom-border-200">
          <h2 className="text-xl font-semibold text-custom-text-100 mb-4">
            🏗️ Architecture
          </h2>
          <pre className="text-sm text-custom-text-300 overflow-x-auto">
{`Frontend (React)
   ↓ useAIStream hook
Next.js API Routes (/api/ai/*)
   ↓ Proxy to backend
NestJS Backend (/api/ai/*-stream)
   ↓ @Sse() endpoints
AI Service (*Stream methods)
   ↓ async generators
OpenAI Service (streaming)
   ↓ stream: true
OpenAI API (GPT-4)`}
          </pre>
        </div>
      </div>
    </div>
  );
}
