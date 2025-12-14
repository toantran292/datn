'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initializeJitsi } from '@/lib/jitsi';
import { useJitsiConnection } from '@/hooks/useJitsiConnection';
import { useJitsiConference } from '@/hooks/useJitsiConference';
import { WaitingState } from '@/components/WaitingState';
import { ControlsToolbar } from '@/components/ControlsToolbar';
import { MeetingGrid } from '@/components/MeetingGrid';
import { ScreenShareView } from '@/components/ScreenShareView';
import type { JitsiTrack } from '@/types/jitsi';
import { Video } from 'lucide-react';

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

    initializeJitsi().catch(err => {
      console.error('[Meeting] Failed to initialize Jitsi:', err);
    });

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

  // Jitsi conference - simplified hook
  const {
    isJoined,
    participants,
    localTracks,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    screenShareTrack,
    isLocalSpeaking,
    speakingParticipants,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
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

  // Loading state
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

  // Connection error
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

  // Convert participants Map to array
  const participantsArray = Array.from(participants.values());

  // Filter local tracks - exclude screen share track from grid display
  const filteredLocalTracks = localTracks.filter((t: JitsiTrack) => {
    if (t.getType() !== 'video') return true;
    const tAny = t as any;
    const isDesktop = tAny.getVideoType?.() === 'desktop' || tAny.videoType === 'desktop';
    return !isDesktop;
  });

  // Determine screen sharer name
  let screenSharerName = displayName;
  if (screenShareTrack && !screenShareTrack.isLocal()) {
    const sharerId = screenShareTrack.getParticipantId();
    // Find participant by matching ID
    for (const p of participantsArray) {
      if (sharerId.includes(p.id) || p.id.includes(sharerId)) {
        screenSharerName = p.name;
        break;
      }
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--ts-bg-dark)' }}>
      {/* Header - Only show when not in screen share mode */}
      {!isScreenSharing && (
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: 'var(--ts-card-surface)', borderColor: 'var(--ts-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--ts-orange) 0%, var(--ts-teal) 100%)' }}>
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">UTS Meet</h1>
              <p className="text-sm" style={{ color: 'var(--ts-text-secondary)' }}>{roomId}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Connected</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--ts-bg-dark)' }}>
              <svg className="w-4 h-4" style={{ color: 'var(--ts-text-secondary)' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-white font-medium">{participantsArray.length + 1}</span>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid or Screen Share View */}
      <div className="flex-1 overflow-hidden">
        {isScreenSharing && screenShareTrack ? (
          <ScreenShareView
            participants={participantsArray}
            localParticipant={{
              name: displayName,
              tracks: filteredLocalTracks,
            }}
            sharerName={screenSharerName}
            screenShareTrack={screenShareTrack}
            roomId={roomId}
            isLocalSpeaking={isLocalSpeaking}
            speakingParticipants={speakingParticipants}
          />
        ) : (
          <MeetingGrid
            participants={participantsArray}
            localParticipant={{
              name: displayName,
              tracks: filteredLocalTracks,
            }}
            isLocalSpeaking={isLocalSpeaking}
            speakingParticipants={speakingParticipants}
          />
        )}
      </div>

      {/* Controls */}
      <ControlsToolbar
        isMicOn={!isAudioMuted}
        isVideoOn={!isVideoMuted}
        isScreenSharing={isScreenSharing}
        onToggleMic={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onLeave={handleLeave}
      />
    </div>
  );
}
