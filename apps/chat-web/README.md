# Chat Web - UTS

Minimal React frontend for UTS Chat Service

## Features

- ✅ Login with User ID and Org ID
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

Edit `.env.local`:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080
```

### 3. Run Development Server

```bash
pnpm dev
```

The app will open at `http://localhost:40503`

## Usage

### Login

1. Enter your **User ID** (UUID format)
2. Enter your **Org ID** (UUID format)
3. Click **Login**

Example UUIDs:
- User ID: `123e4567-e89b-12d3-a456-426614174000`
- Org ID: `123e4567-e89b-12d3-a456-426614174001`

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
│   └── socket.ts          # Socket.IO client
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
- **Minimal styling** - Inline CSS for simplicity
