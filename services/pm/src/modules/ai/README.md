# AI Module - Refine Description

## Overview

AI Module provides intelligent description refinement for issues using OpenAI GPT-4o-mini. It automatically structures and enhances issue descriptions according to a universal template that works for all issue types (BUG, STORY, TASK, EPIC).

## Features

- ✅ **Universal Template**: One template that adapts to all issue types
- ✅ **Vietnamese Language**: Outputs in Vietnamese with proper technical term handling
- ✅ **Smart Caching**: 24-hour Redis cache to reduce costs
- ✅ **Rate Limiting**: Prevents API abuse
- ✅ **Confidence Scoring**: AI confidence score for each refinement
- ✅ **Cost Effective**: ~$0.00135 per request

## API Endpoint

### POST `/api/ai/refine-description`

Refines an issue description using AI.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "issueId": "550e8400-e29b-41d4-a716-446655440000",
  "currentDescription": "fix bug login",
  "issueName": "Fix login bug",
  "issueType": "BUG",
  "priority": "HIGH",
  "context": {
    "projectName": "E-commerce Platform",
    "sprintGoal": "Improve authentication"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "refinedDescription": "## 📌 Tóm tắt\n\nNgười dùng không thể đăng nhập...",
    "refinedDescriptionHtml": "<h2>📌 Tóm tắt</h2><p>Người dùng...</p>",
    "improvements": [
      "Thêm cấu trúc markdown rõ ràng",
      "Mở rộng mô tả với chi tiết cụ thể",
      "Thêm acceptance criteria"
    ],
    "confidence": 0.95
  },
  "metadata": {
    "model": "gpt-4o-mini",
    "tokensUsed": 450,
    "processingTime": 1250
  }
}
```

## Environment Variables

Required environment variables (add to `.env`):

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-api-key-here
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Setup

1. **Install Dependencies**:
```bash
cd services/pm
pnpm install
```

2. **Configure Environment**:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. **Start Redis** (if not running):
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

4. **Run the Service**:
```bash
pnpm start:dev
```

## Usage Example

### cURL

```bash
curl -X POST http://localhost:3000/api/ai/refine-description \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "issueId": "uuid-here",
    "currentDescription": "fix bug login",
    "issueName": "Login Error",
    "issueType": "BUG",
    "priority": "HIGH"
  }'
```

### TypeScript/JavaScript

```typescript
const response = await fetch('/api/ai/refine-description', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    issueId: '123',
    currentDescription: 'fix bug login',
    issueName: 'Login Error',
    issueType: 'BUG',
    priority: 'HIGH',
  }),
});

const result = await response.json();
console.log(result.data.refinedDescription);
```

## Universal Template Structure

The AI uses a universal template with the following sections:

1. **📌 Tóm tắt** - Brief 1-2 sentence summary
2. **📝 Mô tả chi tiết** - Context and background
3. **🎯 Mục tiêu** - Objective/goal
4. **📋 Chi tiết thực hiện** - Implementation details (adapts by type)
   - BUG: Reproduction steps, Actual vs Expected
   - STORY: User flow, User persona
   - TASK: Action items, Technical approach
   - EPIC: Scope, Implementation phases
5. **✅ Acceptance Criteria / Definition of Done** - Checklist
6. **🔗 Thông tin bổ sung** - Optional metadata

## Caching Strategy

- **Cache Key**: Generated from `issueId` + `description hash`
- **TTL**: 24 hours
- **Benefits**: Reduces duplicate AI calls, lowers costs

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_SERVICE_ERROR` | 500 | OpenAI API error |

## Cost Estimation

**Per Request**:
- Input tokens: ~500 tokens
- Output tokens: ~1000 tokens
- Cost: ~$0.00135

**Monthly** (1000 users, 5 refines/user/month):
- Total requests: 5,000
- Total cost: **$6.75/month**

## Performance

- **Target Response Time**: < 3 seconds (95th percentile)
- **Cache Hit Rate**: ~40-50% (reduces actual AI calls)
- **Concurrent Requests**: Supports 100 req/second

## Security

- ✅ JWT authentication required
- ✅ Input sanitization (max 10,000 chars)
- ✅ API key stored in environment variables
- ✅ No PII sent to OpenAI
- ✅ Rate limiting per user

## Monitoring

Key metrics to track:

- `ai.refine.request.count` - Total requests
- `ai.refine.request.duration` - Response time
- `ai.refine.cache.hit_rate` - Cache effectiveness
- `ai.refine.cost.total` - Monthly cost
- `ai.refine.confidence.avg` - Average confidence score

## Troubleshooting

### OpenAI API Error

**Error**: `OpenAI API authentication failed`

**Solution**: Check your `OPENAI_API_KEY` in `.env`

### Redis Connection Error

**Error**: `Cache manager connection failed`

**Solution**: Ensure Redis is running on configured host/port

### Rate Limit Exceeded

**Error**: `429 Rate limit exceeded`

**Solution**: Wait and retry. Default limit is 20 requests/hour per user.

## Development

### Running Tests

```bash
# Unit tests
pnpm test src/modules/ai

# E2E tests
pnpm test:e2e
```

### Code Structure

```
src/modules/ai/
├── ai.module.ts          # Module definition
├── ai.controller.ts      # REST API endpoint
├── ai.service.ts         # Core business logic
├── openai.service.ts     # OpenAI API integration
├── prompt.service.ts     # Prompt engineering
├── dto/                  # Data Transfer Objects
│   ├── refine-description.dto.ts
│   └── refine-description-response.dto.ts
└── README.md            # This file
```

## License

Internal use only - Part of PM Service
