# Implementation Summary: Auth-Web to Tenant-Web Navigation with Shared Authentication

## Overview
Implemented seamless navigation from auth-web (localhost:3000) to tenant-web (localhost:3001) with shared authentication cookies.

## What Was Implemented

### 1. Environment Configuration

#### Auth-Web (.env.local)
```env
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_PM_URL=http://localhost:3001
```

#### Tenant-Web (.env.local)
```env
VITE_API_BASE=http://localhost:8080
```

### 2. Cookie Sharing Setup

**Backend Configuration (Identity Service)**
- Cookies are set with `SameSite=Lax` attribute
- Domain is NOT set for localhost (browser automatically shares cookies across ports on localhost)
- Cookie name: `uts_at` (access token)
- Configuration in: `services/identity/src/main/java/com/datn/identity/interfaces/api/AuthTokenController.java`

**Key Points:**
- `credentials: 'include'` enabled in fetch calls on both frontends
- Cookies automatically shared between localhost:3000 and localhost:3001
- No additional CORS configuration needed for localhost

### 3. Tenant-Web Authentication Implementation

#### Created Files:

**1. API Client (`apps/tenant-web/src/lib/api.ts`)**
- Generic API functions: `apiGet`, `apiPost`, `apiPut`, `apiDelete`
- Automatic cookie inclusion with `credentials: 'include'`
- Error handling with custom `ApiError` class
- Base URL from environment variable

**2. Auth Hook (`apps/tenant-web/src/hooks/useAuth.ts`)**
- `useAuth()` hook for authentication state management
- Calls `/auth/me` endpoint to verify authentication
- Returns: `{ user, isLoading, isAuthenticated, error }`
- Auto-redirects to login if 401 error

**3. Updated Components:**

- **App.tsx**: Added authentication check and loading states
- **DashboardLayout.tsx**: Added `user` prop to pass user data to TopBar
- **TopBar.tsx**: Updated to display real user data (email, display name, initials)

#### Modified Files:
- `apps/tenant-web/package.json`: Added `@types/react` and `@types/react-dom`

### 4. Navigation Flow

1. User logs in at **auth-web** (localhost:3000)
2. Backend sets `uts_at` cookie with user's access token
3. User selects workspace and clicks "Enter workspace"
4. Navigates to `/enter?org_id={orgId}` with loading animation
5. Redirects to **tenant-web** (`http://localhost:3001?org_id={orgId}`)
6. Tenant-web's `useAuth()` hook:
   - Calls `/auth/me` with cookie automatically included
   - Verifies authentication
   - Loads user data
7. If authenticated: Shows dashboard with user info
8. If not authenticated: Redirects back to auth-web login

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Auth-Web   │         │  Tenant-Web  │         │   Backend   │
│ localhost:  │         │  localhost:  │         │  Identity   │
│    3000     │         │    3001      │         │   Service   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                         │
      │  1. Login              │                         │
      ├───────────────────────────────────────────────>│
      │                        │                         │
      │  2. Set-Cookie: uts_at │                         │
      │<───────────────────────────────────────────────┤
      │                        │                         │
      │  3. Navigate to        │                         │
      │     tenant-web         │                         │
      ├──────────────────────>│                         │
      │                        │                         │
      │                        │  4. GET /auth/me        │
      │                        │  Cookie: uts_at         │
      │                        ├───────────────────────>│
      │                        │                         │
      │                        │  5. User data           │
      │                        │<───────────────────────┤
      │                        │                         │
      │                        │  6. Show dashboard      │
      │                        │     with user info      │
```

## Testing Steps

1. **Start all services:**
   ```bash
   make dev.up
   ```

2. **Login to auth-web:**
   - Navigate to http://localhost:3000/login
   - Login with credentials

3. **Navigate to workspaces:**
   - Should see list of workspaces
   - Click "Enter workspace" button

4. **Verify tenant-web:**
   - Should redirect to http://localhost:3001
   - Should show loading screen briefly
   - Should display dashboard with:
     - User's email in TopBar
     - User's display name (or email username if no display name)
     - User's initials in avatar
   - Should NOT redirect back to login

5. **Verify authentication:**
   - Open DevTools > Application > Cookies
   - Should see `uts_at` cookie set for localhost
   - Open DevTools > Network
   - Should see `/auth/me` request with 200 response
   - Should see cookie automatically included in request headers

## Security Considerations

- Cookies are `HttpOnly` (cannot be accessed via JavaScript)
- Cookies use `SameSite=Lax` (prevents CSRF attacks)
- Access token has 15-minute TTL (configured in backend)
- Tenant-web validates authentication on every page load
- Auto-redirects to login if token is invalid/expired

## Future Enhancements

1. **Refresh Token Support**: Currently disabled, can be enabled in backend config
2. **Org Context**: Pass `org_id` from URL to API requests for org-scoped operations
3. **Better Error Handling**: Show friendly error messages for network failures
4. **Loading States**: Add skeleton loaders for better UX
5. **Token Refresh**: Implement automatic token refresh before expiration
6. **Logout**: Add logout functionality that clears cookies
7. **Role-Based UI**: Show/hide features based on user's role in organization

## Nginx Edge Configuration

Updated `services/edge/configs/nginx.conf` to proxy identity service endpoints through port 8080:

### Added Proxy Routes:

1. **`/auth/*` → identity:40000** (No AuthZ check)
   - Public authentication endpoints (login, token, logout)
   - Rate limit: 120 requests/minute
   - Example: `http://localhost:8080/auth/token`

2. **`/me/*` → identity:40000** (Requires AuthZ)
   - User profile endpoints
   - Requires valid access token
   - Rate limit: 60 requests/minute
   - Example: `http://localhost:8080/me/tenants`

3. **`/oauth2/*` → identity:40000** (No AuthZ check)
   - OAuth2 flows (Google login)
   - Rate limit: 80 requests/minute
   - Example: `http://localhost:8080/oauth2/authorization/google`

### Benefits:
- Single entry point through Edge (localhost:8080)
- Consistent CORS handling across all services
- Rate limiting per endpoint type
- HMAC signing for authenticated requests to `/me/*`
- Unified API base URL for both auth-web and tenant-web

## Files Changed

### Created:
- `apps/auth-web/.env.local`
- `apps/tenant-web/.env.local`
- `apps/tenant-web/src/lib/api.ts`
- `apps/tenant-web/src/hooks/useAuth.ts`
- `IMPLEMENTATION_SUMMARY.md` (this file)

### Modified:
- `apps/tenant-web/src/App.tsx`
- `apps/tenant-web/src/components/DashboardLayout.tsx`
- `apps/tenant-web/src/components/TopBar.tsx`
- `apps/tenant-web/package.json`
- `services/edge/configs/nginx.conf` (added identity proxy routes)

### Existing (No Changes Needed):
- `apps/auth-web/src/app/workspaces/page.tsx` (Button already works)
- `apps/auth-web/src/app/enter/page.tsx` (Redirect already implemented)
- `services/identity/src/main/resources/application.yml` (Cookie config already correct)
- `services/identity/src/main/java/com/datn/identity/interfaces/api/AuthTokenController.java` (Cookie setting already correct)

## Notes

- The TypeScript errors about React types were resolved by adding `@types/react` and `@types/react-dom` to devDependencies
- Cookie sharing works automatically on localhost without needing to set Domain attribute
- The `useAuth` hook runs on component mount, ensuring auth check happens immediately
- Backend CORS config allows credentials from both origins (handled by Edge service)
