# Chat Web - UTS

Minimal React frontend for UTS Chat Service

## Features

- ✅ Automatic authentication via auth-web (cookie-based)
- ✅ Create rooms (public/private)
- ✅ List rooms
- ✅ Join rooms
- ✅ Real-time messaging via WebSocket
- ✅ View message history

## Setup

### 1. Install Dependencies

```bash
cd apps/chat-web
pnpm install
```

### 2. Configure Environment

Create `.env.local` or `.env`:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080
VITE_AUTH_WEB_URL=http://localhost:3001
```

**Environment Variables:**
- `VITE_API_URL`: Backend API base URL (default: `http://localhost:8080`)
- `VITE_WS_URL`: WebSocket server URL (default: `http://localhost:8080`)
- `VITE_AUTH_WEB_URL`: Authentication web app URL for login redirect (default: `http://localhost:3001`)

### 3. Run Development Server

```bash
pnpm dev
```

The app will open at `http://localhost:3003`

## Usage

### Authentication

The app automatically authenticates using cookies from `auth-web`:

1. When you first visit the app, it checks if you're logged in via `/auth/me` endpoint
2. If not authenticated, you'll be redirected to `auth-web` login page
3. After logging in via `auth-web`, you'll be redirected back to chat
4. The app automatically connects to chat with your user info

### Create Room

1. Click **+ New** button
2. Enter room name
3. Check **Private** if needed
4. Click **Create**

### Send Messages

1. Select a room from the list
2. Type message in the input box
3. Press **Send** or hit Enter

## Architecture

```
src/
├── components/
│   ├── RoomsList.tsx      # Sidebar with room list
│   └── ChatWindow.tsx     # Main chat interface
├── services/
│   ├── api.ts             # REST API client
│   ├── socket.ts          # Socket.IO client
│   └── auth.ts            # Authentication service
├── types/
│   └── index.ts           # TypeScript types
├── App.tsx                # Main app component
└── main.tsx               # Entry point
```

## API Endpoints (via Edge)

- `POST /api/chat/rooms` - Create room
- `GET /api/chat/rooms` - List rooms
- `POST /api/chat/rooms/join` - Join room
- `GET /api/chat/messages?roomId=` - Get message history

## WebSocket Events

### Client → Server
- `join_room` - Join room channel
- `send_message` - Send message

### Server → Client
- `rooms:bootstrap` - Initial room list
- `room:created` - New room notification
- `room:updated` - Room update (new message)
- `message:new` - New message in current room
- `joined_room` - Join confirmation

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Socket.IO Client** - WebSocket connection
- **Cookie-based Authentication** - Shared session with auth-web
- **Minimal styling** - Inline CSS for simplicity

## Backend Requirements

For this app to work properly, the backend must be configured correctly:

### 1. CORS Configuration

The backend must allow credentials and accept requests from the chat-web origin:

```java
// Example Spring Boot CORS config
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:3001", // auth-web
        "http://localhost:3003"  // chat-web
    ));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true); // Important!
    return source;
}
```

### 2. Socket.IO CORS

The chat service WebSocket must also allow credentials:

```typescript
// Example NestJS Socket.IO config
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3003'],
    credentials: true,
  },
})
```

### 3. Cookie Settings

Authentication cookies must be configured to work across different ports:

- `SameSite=Lax` or `SameSite=None` (if using HTTPS)
- `HttpOnly=true` for security
- `Secure=true` in production
- Appropriate `Path` and `Domain` settings

## Troubleshooting

### "User not authenticated" loop

If the app keeps redirecting to login:
1. Check browser DevTools → Application → Cookies to see if auth cookies exist
2. Verify backend CORS allows credentials
3. Ensure `/auth/me` endpoint returns 200 with user data
4. Check that cookies are sent in requests (Network tab → Request Headers)

### WebSocket connection fails

If socket connection fails:
1. Check `VITE_WS_URL` points to correct backend
2. Verify backend Socket.IO CORS config
3. Check browser console for connection errors
4. Ensure backend is running and accessible
