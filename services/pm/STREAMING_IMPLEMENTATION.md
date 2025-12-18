# 🌊 Backend HTTP Streaming Implementation

## Overview

Backend NestJS service now supports **Server-Sent Events (SSE)** for real-time AI response streaming, similar to ChatGPT!

## ✅ What's Been Implemented

### 1. **OpenAI Service** ([openai.service.ts](cci:7://file:///Users/dattuanzz/StudySpaces/datn/services/pm/src/modules/ai/openai.service.ts:0:0-0:0))

Added streaming method:

```typescript
async *createStreamingChatCompletion(
  request: Partial<ChatCompletionRequest>
): AsyncGenerator<string>
```

- Uses OpenAI's streaming API (`stream: true`)
- Yields content chunks in real-time
- Handles errors with proper exception handling
- Logs performance metrics

### 2. **AI Service** ([ai.service.ts](cci:7://file:///Users/dattuanzz/StudySpaces/datn/services/pm/src/modules/ai/ai.service.ts:0:0-0:0))

Added 3 streaming methods:

#### `refineDescriptionStream(dto)`
- Streams refined description in real-time
- Yields `{ type: 'text', content: chunk }`
- Sends confidence score after completion
- Includes metadata with improvements count

#### `estimateStoryPointsStream(dto)`
- Streams estimation analysis word-by-word
- Yields text chunks during generation
- Sends confidence from parsed JSON response
- Includes metadata with suggested points

#### `breakdownEpicStream(dto)`
- Streams breakdown analysis in real-time
- Validates breakdown after streaming completes
- Sends confidence from validation scores
- Includes metadata (subtasks count, total points, complexity)

### 3. **AI Controller** ([ai.controller.ts](cci:7://file:///Users/dattuanzz/StudySpaces/datn/services/pm/src/modules/ai/ai.controller.ts:0:0-0:0))

Added 3 new SSE endpoints:

- `POST /api/ai/refine-description-stream` - Streaming refine
- `POST /api/ai/estimate-points-stream` - Streaming estimation
- `POST /api/ai/breakdown-issue-stream` - Streaming breakdown

All use `@Sse()` decorator and return `Observable<MessageEvent>`.

## 📡 API Endpoints

### Streaming Endpoints (NEW)

#### 1. Refine Description Stream
```
POST /api/ai/refine-description-stream
Content-Type: application/json

{
  "issueId": "ISSUE-123",
  "issueType": "STORY",
  "currentDescription": "Add login feature"
}

Response: text/event-stream
data: {"type":"text","content":"Refined "}
data: {"type":"text","content":"description "}
...
data: {"type":"confidence","value":0.95}
data: {"type":"metadata","value":{"improvementsCount":5}}
```

#### 2. Estimate Points Stream
```
POST /api/ai/estimate-points-stream
Content-Type: application/json

{
  "issueId": "ISSUE-123",
  "issueType": "STORY",
  "currentDescription": "Add login feature",
  "priority": "HIGH"
}

Response: text/event-stream
data: {"type":"text","content":"Story "}
data: {"type":"text","content":"points: "}
...
data: {"type":"confidence","value":0.92}
data: {"type":"metadata","value":{"suggestedPoints":5}}
```

#### 3. Breakdown Issue Stream
```
POST /api/ai/breakdown-issue-stream
Content-Type: application/json

{
  "issueId": "EPIC-123",
  "issueType": "EPIC",
  "currentDescription": "User authentication system"
}

Response: text/event-stream
data: {"type":"text","content":"Creating "}
data: {"type":"text","content":"subtasks... "}
...
data: {"type":"confidence","value":0.88}
data: {"type":"metadata","value":{"subtasksCount":4,"totalPoints":12,"complexity":"medium"}}
```

### Legacy Endpoints (Still Available)

These endpoints return complete responses (non-streaming):

- `POST /api/ai/refine-description`
- `POST /api/ai/estimate-points`
- `POST /api/ai/breakdown-issue`

## 🔧 Message Types

Each streaming endpoint sends SSE messages with the following format:

### 1. Text Chunk
```json
{
  "type": "text",
  "content": "word "
}
```

### 2. Confidence Score
```json
{
  "type": "confidence",
  "value": 0.95
}
```
- Value range: 0.0 - 1.0 (frontend expects 0-100, multiply by 100)

### 3. Metadata
```json
{
  "type": "metadata",
  "value": {
    "improvementsCount": 5,
    "suggestedPoints": 5,
    "subtasksCount": 4,
    "totalPoints": 12,
    "complexity": "medium"
  }
}
```

### 4. Error
```json
{
  "type": "error",
  "message": "Error description"
}
```

## 🚀 Frontend Integration

Frontend Next.js API routes now proxy to backend streaming endpoints:

### `/app/api/ai/refine/route.ts`
```typescript
const response = await fetch(`${BACKEND_URL}/api/ai/refine-description-stream`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

return new Response(response.body, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  },
});
```

### Frontend Components Use `useAIStream` Hook

```typescript
const { streamAI, isStreaming, streamedText } = useAIStream({
  onChunk: (chunk) => console.log(chunk),
});

await streamAI("/api/ai/refine", { issueId: "123" });
```

## 🎯 Architecture

```
┌─────────────────┐
│  Frontend       │
│  (React)        │
│  useAIStream()  │
└────────┬────────┘
         │ HTTP POST
         ▼
┌─────────────────┐
│  Next.js API    │
│  /api/ai/*      │
│  (Proxy)        │
└────────┬────────┘
         │ HTTP POST (SSE)
         ▼
┌─────────────────┐
│  NestJS         │
│  AI Controller  │
│  @Sse()         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Service     │
│  *Stream()      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OpenAI Service │
│  streaming API  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OpenAI API     │
│  GPT-4          │
└─────────────────┘
```

## 💡 Key Features

### ✨ Real-time Streaming
- Text appears word-by-word as AI generates it
- ChatGPT-style user experience
- Smooth, professional animations

### 🔄 Backward Compatible
- Old endpoints still work (non-streaming)
- New streaming endpoints added alongside
- No breaking changes

### 📊 Confidence Scores
- Calculated after streaming completes
- Based on content analysis and heuristics
- Range: 0.0 - 1.0 (convert to 0-100 for display)

### 🎨 Metadata
- Additional context about the response
- Different per endpoint
- Sent after streaming completes

### ⚡ Error Handling
- Graceful error messages via SSE
- Proper exception handling at all layers
- Frontend receives error events

## 🔍 Testing

### Test Streaming Endpoint

```bash
curl -N -X POST http://localhost:3001/api/ai/refine-description-stream \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": "TEST-123",
    "issueType": "STORY",
    "currentDescription": "Add user login"
  }'
```

Expected output:
```
data: {"type":"text","content":"Refined "}
data: {"type":"text","content":"description "}
...
data: {"type":"confidence","value":0.95}
data: {"type":"metadata","value":{"improvementsCount":5}}
```

## ⚙️ Configuration

### Environment Variables

```env
# Backend (.env)
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🐛 Troubleshooting

### Stream Not Working?
1. Check if backend is running: `http://localhost:3001`
2. Verify OPENAI_API_KEY is set
3. Check network tab for SSE connection
4. Verify `Content-Type: text/event-stream` header

### No Text Appearing?
1. Check browser console for errors
2. Verify frontend `useAIStream` hook is used
3. Check backend logs for streaming errors
4. Test with curl to isolate frontend/backend issue

### Confidence Not Showing?
1. Confidence is sent AFTER streaming completes
2. Check if `onComplete` callback is called
3. Verify confidence is between 0.0-1.0 (multiply by 100)

## 📚 References

- [NestJS SSE Documentation](https://docs.nestjs.com/techniques/server-sent-events)
- [OpenAI Streaming API](https://platform.openai.com/docs/api-reference/streaming)
- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 🎉 Result

Backend now fully supports HTTP Streaming with:

✅ **Real-time SSE streaming** from OpenAI API
✅ **3 streaming endpoints** (refine, estimate, breakdown)
✅ **Backward compatible** (old endpoints still work)
✅ **Proper error handling** at all layers
✅ **Confidence scores** and metadata
✅ **Frontend integration** via Next.js proxy
✅ **Production ready** code with logging

**Users will experience ChatGPT-style streaming! 🤩**

---

Built with ❤️ for UTS Project Management System
