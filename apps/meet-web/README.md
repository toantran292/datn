# UTS Meet Web

Custom Jitsi meeting application built with Next.js 15 and lib-jitsi-meet.

## Features

- ✅ Custom UI (no default Jitsi UI)
- ✅ Direct WebSocket connection to Jitsi (Prosody)
- ✅ JWT authentication from backend
- ✅ Real-time video conferencing
- ✅ Audio/video controls
- ✅ Grid layout for participants
- ✅ Responsive design with Tailwind CSS

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **lib-jitsi-meet** - Jitsi Meet library
- **Tailwind CSS** - Styling
- **Motion** - Animations
- **Lucide React** - Icons

## Getting Started

### Prerequisites

1. Backend service running on `http://localhost:40600`
2. Jitsi infrastructure (Prosody, Jicofo, JVB) running

### Installation

```bash
cd apps/meet-web
pnpm install
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_MEET_API=http://localhost:40600
NEXT_PUBLIC_JITSI_DOMAIN=meet.local
NEXT_PUBLIC_JITSI_WEBSOCKET_URL=ws://192.168.100.195:40680/xmpp-websocket
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

### Flow

1. **Join Page** (`/join`)
   - User enters ID, name, and meeting details
   - Calls backend `/meet/token` to get JWT
   - Stores token and meeting info in localStorage
   - Redirects to meeting room

2. **Meeting Page** (`/meet/[roomId]`)
   - Initializes lib-jitsi-meet
   - Creates WebSocket connection to Prosody
   - Joins conference room
   - Creates local audio/video tracks
   - Renders participant videos in grid
   - Provides controls for mute/unmute

### Key Components

- **`lib/jitsi.ts`** - Jitsi initialization and helpers
- **`hooks/useJitsiConnection.ts`** - WebSocket connection management
- **`hooks/useJitsiConference.ts`** - Conference room management
- **`components/ParticipantVideo.tsx`** - Video rendering
- **`components/ControlsToolbar.tsx`** - Meeting controls
- **`components/WaitingState.tsx`** - Loading state

## API Integration

### Backend Endpoints

```typescript
// Get JWT token and meeting info
POST /meet/token
{
  user_id: string;
  user_name?: string;
  subject_type: 'chat' | 'project';
  chat_id?: string;  // for chat meetings
  project_id?: string;  // for project meetings
  room_id?: string;  // optional
}

Response:
{
  token: string;  // JWT
  room_id: string;
  meeting_id: string;
  websocket_url: string;
  ice_servers: any[];
}
```

## Troubleshooting

### Video/Audio Not Working

- Check browser permissions for camera/microphone
- Ensure Jitsi infrastructure is running
- Check WebSocket connection in browser console

### Connection Failed

- Verify backend is running on port 40600
- Check `.env.local` has correct URLs
- Ensure Jitsi WebSocket endpoint is accessible

### Participants Not Visible

- Check conference joined successfully (console logs)
- Verify tracks are being created
- Check participant video rendering

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## License

MIT
