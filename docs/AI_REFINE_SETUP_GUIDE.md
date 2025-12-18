# AI Refine Description - Setup Guide

This guide will walk you through setting up the AI-powered description refinement feature for your project management system.

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ installed
- ✅ pnpm package manager
- ✅ PostgreSQL database running
- ✅ Redis server installed and running
- ✅ OpenAI API account with billing enabled

## Step 1: OpenAI API Key

### 1.1 Create OpenAI Account

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)

### 1.2 Set Up Billing

**IMPORTANT:** You must add a payment method before you can use the API.

1. Go to [Billing Settings](https://platform.openai.com/account/billing/overview)
2. Click "Add payment method"
3. Enter your credit card information
4. (Optional) Set spending limits to control costs

### 1.3 Generate API Key

1. Go to [API Keys page](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Give it a name like "PM-AI-Feature"
4. **IMPORTANT:** Copy the key immediately - you won't be able to see it again!
5. Store it securely (you'll need it in Step 3)

### 1.4 Cost Estimation

With **gpt-4o-mini** model:
- **Per request:** ~$0.00135 (assuming 500 input + 1000 output tokens)
- **1000 users × 5 requests/month:** ~$6.75/month
- **Very cost-effective** for small to medium teams

## Step 2: Install Redis

Redis is required for caching AI responses to reduce costs and improve performance.

### On macOS (using Homebrew):
```bash
brew install redis
brew services start redis
```

### On Ubuntu/Debian:
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### On Windows:
1. Download Redis from [GitHub](https://github.com/microsoftarchive/redis/releases)
2. Extract and run `redis-server.exe`

### Verify Redis is Running:
```bash
redis-cli ping
# Should return: PONG
```

## Step 3: Backend Configuration

### 3.1 Navigate to Backend Directory
```bash
cd /path/to/project/datn/services/pm
```

### 3.2 Create Environment File

Copy the example environment file:
```bash
cp .env.example .env
```

### 3.3 Edit .env File

Open `.env` and update these values:

```env
# AI Configuration
OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-API-KEY-HERE
AI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Redis Configuration (use default if running locally)
REDIS_HOST=localhost
REDIS_PORT=6379

# Database (if not already configured)
DATABASE_URL="postgresql://pm_user:pm_pass@localhost:5432/pm_db?schema=public"

# Application
NODE_ENV=development
PORT=3000

# CORS (adjust for your frontend URL)
CORS_ORIGIN=http://localhost:40401
```

**Security Note:** Never commit the `.env` file to version control!

### 3.4 Install Dependencies

```bash
pnpm install
```

### 3.5 Run Database Migrations (if needed)

```bash
pnpm prisma migrate dev
```

### 3.6 Start Backend Server

```bash
pnpm start:dev
```

The backend should start on `http://localhost:3000`.

### 3.7 Verify AI Endpoint

Test the AI endpoint:
```bash
curl -X POST http://localhost:3000/api/ai/refine-description \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": "test-123",
    "currentDescription": "Fix the bug in login",
    "issueType": "BUG",
    "priority": "HIGH"
  }'
```

You should receive a JSON response with refined description.

## Step 4: Frontend Configuration

### 4.1 Navigate to Frontend Directory
```bash
cd /path/to/project/datn/apps/pm-web
```

### 4.2 Create Environment File

```bash
cp .env.example .env.local
```

### 4.3 Edit .env.local

```env
# API Configuration (via nginx proxy)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/pm

# Note: If running backend directly without nginx, use:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 4.4 Install Dependencies (if not already installed)

From the root of the monorepo:
```bash
cd /path/to/project/datn
pnpm install
```

### 4.5 Start Frontend Development Server

```bash
cd apps/pm-web
pnpm dev
```

The frontend should start on `http://localhost:40401` (or your configured port).

## Step 5: Testing the Feature

### 5.1 Open an Issue

1. Navigate to your application in the browser
2. Open or create a project
3. Open or create an issue

### 5.2 Test AI Refine

1. Add a short description to the issue (minimum 5 characters)
2. Click the **"AI Refine"** button near the description field
3. Wait 5-10 seconds for the AI to process
4. Review the refined description in the modal
5. Compare "Original" vs "Refined" tabs
6. Review the list of improvements
7. Click **"Apply Changes"** to use the refined description

### 5.3 Verify Caching

1. Refine the same description again
2. It should return instantly (cached response)
3. Check backend logs - you should see "Cache hit" message

## Step 6: Monitoring and Troubleshooting

### 6.1 Check Backend Logs

Watch the backend logs for AI requests:
```bash
cd services/pm
pnpm start:dev
```

Look for:
- ✅ `Refine request for issue <id>`
- ✅ `Cache hit for key: ...` (for cached responses)
- ✅ `Cached result for key: ...` (for new responses)
- ❌ Error messages if something fails

### 6.2 Monitor Redis

Check Redis for cached responses:
```bash
redis-cli
> KEYS ai-refine:*
> GET ai-refine:<issue-id>:<hash>
```

### 6.3 Common Issues

#### Issue: "Unauthorized" or "Invalid API Key"
- **Solution:** Check that `OPENAI_API_KEY` in `.env` is correct
- Verify the key at [OpenAI API Keys](https://platform.openai.com/api-keys)

#### Issue: "Insufficient credits" or "Rate limit exceeded"
- **Solution:** Check your [OpenAI billing](https://platform.openai.com/account/billing)
- Add payment method or increase spending limits

#### Issue: "Redis connection failed"
- **Solution:** Ensure Redis is running:
  ```bash
  redis-cli ping  # Should return PONG
  ```
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

#### Issue: Frontend can't connect to backend
- **Solution:** Verify `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.local`:
  - With nginx proxy: `http://localhost:8080/pm`
  - Direct backend: `http://localhost:3000`
- Check backend is running on the correct port
- If using nginx, ensure nginx is running and properly configured
- Verify CORS settings in backend `.env`

#### Issue: "Description too short" error
- **Solution:** AI requires at least 5 characters
- Add more detail to the description before refining

### 6.4 Cost Monitoring

Monitor your OpenAI usage:
1. Go to [OpenAI Usage](https://platform.openai.com/usage)
2. Check daily/monthly costs
3. Set up usage alerts if needed

## Step 7: Production Deployment

### 7.1 Security Checklist

Before deploying to production:

- [ ] **Never expose** `OPENAI_API_KEY` in frontend code
- [ ] Keep `.env` files out of version control (check `.gitignore`)
- [ ] Use environment variables from your hosting platform
- [ ] Enable authentication (currently commented out in code)
- [ ] Set up proper CORS origins (not wildcard `*`)
- [ ] Configure rate limiting per user/IP
- [ ] Set up monitoring and alerting for API costs

### 7.2 Environment Variables

Set these on your hosting platform (e.g., Vercel, AWS, Heroku):

**Backend:**
```
OPENAI_API_KEY=<your-key>
AI_MODEL=gpt-4o-mini
REDIS_HOST=<production-redis-url>
REDIS_PORT=<production-redis-port>
DATABASE_URL=<production-db-url>
CORS_ORIGIN=<production-frontend-url>
```

**Frontend:**
```
NEXT_PUBLIC_API_BASE_URL=<production-backend-url>
```

### 7.3 Redis in Production

Consider using a managed Redis service:
- **AWS ElastiCache**
- **Redis Cloud**
- **Upstash** (serverless Redis)
- **DigitalOcean Managed Redis**

Update `REDIS_HOST` and `REDIS_PORT` accordingly.

## Step 8: Advanced Configuration

### 8.1 Adjust AI Model

If you need higher quality (but higher cost):
```env
AI_MODEL=gpt-4o  # More expensive but better quality
```

For even lower cost:
```env
AI_MODEL=gpt-3.5-turbo  # Cheapest option
```

### 8.2 Adjust Token Limits

If descriptions are being cut off:
```env
AI_MAX_TOKENS=3000  # Default: 2000
```

**Note:** Higher tokens = higher cost per request.

### 8.3 Adjust Temperature

For more creative outputs:
```env
AI_TEMPERATURE=0.9  # Default: 0.7, Range: 0-1
```

Lower temperature (0.3-0.5) for more consistent outputs.

### 8.4 Cache TTL

To change cache duration, edit `ai.module.ts`:
```typescript
ttl: 86400  // 24 hours in seconds (default)
```

## Support and Documentation

- **Backend API Docs:** `/services/pm/src/modules/ai/README.md`
- **Frontend Components:** `/apps/pm-web/src/core/components/ai/README.md`
- **Feature Spec:** `/docs/AI_REFINE_DESCRIPTION_FEATURE_SPEC.md`
- **Implementation Plan:** `/docs/AI_REFINE_IMPLEMENTATION_PLAN.md`

## Success Criteria

You'll know the feature is working correctly when:

1. ✅ AI button appears in issue detail page when there's a description
2. ✅ Clicking AI button shows loading state (5-10 seconds)
3. ✅ Modal displays refined description with improvements list
4. ✅ Confidence score is displayed (0-100%)
5. ✅ Can switch between Original and Refined tabs
6. ✅ Applying changes updates the issue description
7. ✅ Repeat requests return instantly (from cache)
8. ✅ Backend logs show "Cache hit" for cached responses
9. ✅ OpenAI usage dashboard shows API calls

## Cost Management Tips

1. **Enable caching** (already implemented with 24-hour TTL)
2. **Use gpt-4o-mini** instead of gpt-4 (already configured)
3. **Set OpenAI spending limits** in your account
4. **Monitor usage** regularly on OpenAI dashboard
5. **Implement rate limiting** per user (TODO when auth is added)
6. **Consider batch processing** for multiple issues

## Next Steps

After successfully setting up:

1. **Add authentication** (currently commented out in `ai.controller.ts`)
2. **Implement rate limiting** per user
3. **Add usage analytics** to track feature adoption
4. **Set up monitoring** for OpenAI costs
5. **Create user documentation** for end users
6. **Gather feedback** and iterate on the prompts

---

**Questions or Issues?**
If you encounter problems, check:
1. Backend logs for error messages
2. Browser console for frontend errors
3. Redis connectivity with `redis-cli ping`
4. OpenAI API status at [status.openai.com](https://status.openai.com)
