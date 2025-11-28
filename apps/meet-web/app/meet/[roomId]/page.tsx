'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initializeJitsi } from '@/lib/jitsi';
import { useJitsiConnection } from '@/hooks/useJitsiConnection';
import { useJitsiConference } from '@/hooks/useJitsiConference';
import { WaitingState } from '@/components/WaitingState';
import { ControlsToolbar } from '@/components/ControlsToolbar';
import { LocalVideo } from '@/components/LocalVideo';
import { RemoteVideo } from '@/components/RemoteVideo';
import { motion } from 'motion/react';

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [websocketUrl, setWebsocketUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('User');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Jitsi and load meeting data from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    initializeJitsi();

    // Load meeting info from localStorage
    const token = localStorage.getItem('jwtToken');
    const wsUrl = localStorage.getItem('websocketUrl');
    const name = localStorage.getItem('name') || 'User';

    if (!token || !wsUrl) {
      console.error('[Meeting] Missing token or websocket URL');
      router.push('/join');
      return;
    }

    setJwtToken(token);
    setWebsocketUrl(wsUrl);
    setDisplayName(name);
    setIsInitialized(true);
  }, [router]);

  // Jitsi connection
  const { connection, isConnected, error: connectionError } = useJitsiConnection(
    websocketUrl,
    jwtToken
  );

  // Jitsi conference
  const {
    conference,
    isJoined,
    participants,
    localTracks,
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
    leaveConference,
  } = useJitsiConference(
    connection,
    isConnected ? roomId : null,
    displayName
  );
  // Handle leave
  const handleLeave = async () => {
    await leaveConference();
    router.push('/join');
  };

  if (!isInitialized) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-ts-bg-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ts-orange/20 border-t-ts-orange mx-auto mb-4" />
          <p className="text-ts-text-secondary">Initializing...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-ts-bg-dark">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-ts-text-secondary mb-6">{connectionError}</p>
          <button
            onClick={() => router.push('/join')}
            className="px-6 py-3 bg-ts-orange text-white rounded-xl font-semibold hover:bg-ts-orange/90 transition-colors"
          >
            Back to Join
          </button>
        </div>
      </div>
    );
  }

  // Show waiting state if not connected or not joined
  if (!isConnected || !isJoined) {
    return (
      <div className="w-screen h-screen bg-ts-bg-dark">
        <WaitingState />
      </div>
    );
  }

  // Calculate grid layout
  const totalParticipants = participants.size + 1; // +1 for local user
  const gridCols = Math.ceil(Math.sqrt(totalParticipants));

  return (
    <div className="w-screen h-screen bg-ts-bg-dark flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-ts-bg-card border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-ts-orange to-ts-teal rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 2v6h3l-6 6-6-6h3V2h6zm-6 14h6v6h-6v-6z" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold">UTS Meet</h1>
            <p className="text-ts-text-secondary text-sm">{roomId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Connected</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-ts-bg-dark rounded-lg">
            <svg className="w-4 h-4 text-ts-text-secondary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-white font-medium">{totalParticipants}</span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div
          className="grid gap-4 h-full"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridAutoRows: '1fr',
          }}
        >
          {/* Local video */}
          <LocalVideo
            name={displayName}
            tracks={localTracks}
          />

          {/* Remote participants */}
          {Array.from(participants.values()).map((participant) => {
            return (
              <RemoteVideo
                key={participant.id}
                name={participant.name}
                tracks={participant.tracks}
              />
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <ControlsToolbar
        isMicOn={!isAudioMuted}
        isVideoOn={!isVideoMuted}
        onToggleMic={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={handleLeave}
      />
    </div>
  );
}
