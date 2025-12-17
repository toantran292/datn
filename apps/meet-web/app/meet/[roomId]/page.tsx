'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { initializeJitsi } from '@/lib/jitsi';
import { leaveMeeting } from '@/lib/api';
import { useJitsiConnection } from '@/hooks/useJitsiConnection';
import { useJitsiConference } from '@/hooks/useJitsiConference';
import { WaitingState } from '@/components/WaitingState';
import { ControlsToolbar } from '@/components/ControlsToolbar';
import { MeetingGrid } from '@/components/MeetingGrid';
import { ScreenShareView } from '@/components/ScreenShareView';
import { ReactionDisplay, FloatingReaction } from '@/components/ReactionDisplay';
import { CaptionDisplay, useSpeechRecognition } from '@/components/CaptionDisplay';
import { useTranslation } from '@/hooks/useTranslation';
import { useTranscriptSaver } from '@/hooks/useTranscriptSaver';
import type { LanguageCode } from '@/lib/translation';
import { RecordingIndicator } from '@/components/RecordingIndicator';
import { useClientRecording } from '@/hooks/useClientRecording';
import { SettingsPanel, BackgroundOption } from '@/components/SettingsPanel';
import { MeetingExports } from '@/components/MeetingExports';
import type { JitsiTrack } from '@/types/jitsi';
import { Video } from 'lucide-react';
import { useCallback } from 'react';

// Helper to send message to parent window (for embed mode)
const postToParent = (type: string, payload?: any) => {
  if (typeof window !== 'undefined' && window.parent !== window) {
    window.parent.postMessage({ type, payload }, '*');
  }
};

function MeetingPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;

  // Check if running in embed mode (iframe)
  const isEmbedMode = searchParams.get('embed') === 'true';

  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [websocketUrl, setWebsocketUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('User');
  const [userId, setUserId] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Settings panel state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentCameraId, setCurrentCameraId] = useState<string | undefined>();
  const [currentMicId, setCurrentMicId] = useState<string | undefined>();
  const [currentBackground, setCurrentBackground] = useState<BackgroundOption>({ type: 'none' });

  // Translation settings state
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [translationLang, setTranslationLang] = useState<LanguageCode>('en');

  // Exports panel state
  const [isExportsOpen, setIsExportsOpen] = useState(false);

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
    const uId = localStorage.getItem('userId');
    const mId = localStorage.getItem('meetingId');

    if (!token || !wsUrl) {
      console.error('[Meeting] Missing token or websocket URL');
      router.push('/not-found');
      return;
    }

    setJwtToken(token);
    setWebsocketUrl(wsUrl);
    setDisplayName(name);
    setUserId(uId);
    setMeetingId(mId);
    setIsInitialized(true);

    // Handle page unload - notify meeting service using sendBeacon for reliability
    const handleBeforeUnload = () => {
      if (mId && uId) {
        const API_URL = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600';
        // Use Blob with correct content type for sendBeacon
        const data = new Blob([JSON.stringify({ user_id: uId })], { type: 'application/json' });
        navigator.sendBeacon(`${API_URL}/meet/${mId}/leave`, data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [router]);

  // Refs for use in message handler (to avoid stale closures)
  const handleLeaveRef = useRef<(() => Promise<void>) | null>(null);
  const toggleAudioRef = useRef<(() => Promise<void>) | null>(null);
  const toggleVideoRef = useRef<(() => Promise<void>) | null>(null);

  // Jitsi connection
  const { connection, isConnected, error: connectionError } = useJitsiConnection(
    websocketUrl,
    jwtToken
  );

  // Transcript saver - saves all final captions to database
  const { saveCaption } = useTranscriptSaver({
    meetingId,
    enabled: true, // Always save transcripts
    translateToLang: translationEnabled ? translationLang : undefined,
    currentUserId: userId, // Replace 'local' with real userId
  });

  // Jitsi conference - simplified hook with transcript callback
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
    reactions,
    captions,
    isCaptionsEnabled,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveConference,
    sendReaction,
    removeReaction,
    toggleCaptions,
    sendCaption,
    switchCamera,
    switchMicrophone,
  } = useJitsiConference(
    connection,
    isConnected ? roomId : null,
    displayName,
    { onFinalCaption: saveCaption }
  );

  // Embed mode: Notify parent when connected
  useEffect(() => {
    if (!isEmbedMode) return;
    if (isConnected && isJoined) {
      postToParent('huddle:connected');
    }
  }, [isEmbedMode, isConnected, isJoined]);

  // Embed mode: Send participants data to parent
  useEffect(() => {
    if (!isEmbedMode || !isJoined) return;

    const participantsArray = Array.from(participants.values());
    const participantsData = [
      // Add local participant first
      {
        id: 'local',
        name: displayName,
        avatarUrl: undefined,
        isSpeaking: isLocalSpeaking,
        isMuted: isAudioMuted,
      },
      // Add remote participants
      ...participantsArray.map(p => {
        // Check if participant has audio track that is muted
        const audioTrack = p.tracks.find(t => t.getType() === 'audio');
        const isMuted = audioTrack ? audioTrack.isMuted() : true;
        return {
          id: p.id,
          name: p.name,
          avatarUrl: undefined,
          isSpeaking: speakingParticipants.has(p.id),
          isMuted,
        };
      }),
    ];

    postToParent('huddle:participants', { participants: participantsData });
  }, [isEmbedMode, isJoined, participants, displayName, isLocalSpeaking, isAudioMuted, speakingParticipants]);

  // Embed mode: Send speaking status to parent
  useEffect(() => {
    if (!isEmbedMode || !isJoined) return;

    // Find who is speaking
    let speakingUserName: string | null = null;

    if (isLocalSpeaking) {
      speakingUserName = displayName;
    } else {
      // Check remote participants
      for (const [participantId, _] of speakingParticipants) {
        const participant = participants.get(participantId);
        if (participant) {
          speakingUserName = participant.name;
          break;
        }
      }
    }

    postToParent('huddle:speaking', { userName: speakingUserName });
  }, [isEmbedMode, isJoined, isLocalSpeaking, speakingParticipants, participants, displayName]);

  // Embed mode: Send audio mute status to parent
  useEffect(() => {
    if (!isEmbedMode || !isJoined) return;
    postToParent('huddle:audioMuted', { muted: isAudioMuted });
  }, [isEmbedMode, isJoined, isAudioMuted]);

  // Embed mode: Send video mute status to parent
  useEffect(() => {
    if (!isEmbedMode || !isJoined) return;
    postToParent('huddle:videoMuted', { muted: isVideoMuted });
  }, [isEmbedMode, isJoined, isVideoMuted]);

  // Handle leave
  const handleLeave = async () => {
    // Notify parent window in embed mode
    if (isEmbedMode) {
      postToParent('huddle:leave');
    }
    // Notify meeting service that user is leaving
    if (meetingId && userId) {
      await leaveMeeting(meetingId, userId);
    }
    await leaveConference();
    // Clear stored meeting info
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('websocketUrl');
    localStorage.removeItem('roomId');
    localStorage.removeItem('meetingId');
    localStorage.removeItem('iceServers');
    // Close the tab (works when opened via window.open from chat-web)
    if (!isEmbedMode) {
      window.close();
    }
  };

  // Update refs for message handler
  handleLeaveRef.current = handleLeave;
  toggleAudioRef.current = toggleAudio;
  toggleVideoRef.current = toggleVideo;

  // Embed mode: Listen for commands from parent window
  useEffect(() => {
    if (!isEmbedMode) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type === 'huddle:command') {
        switch (payload?.action) {
          case 'leave':
            handleLeaveRef.current?.();
            break;
          case 'toggleAudio':
            toggleAudioRef.current?.();
            break;
          case 'toggleVideo':
            toggleVideoRef.current?.();
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbedMode]);

  // Settings handlers
  const handleShowSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleCameraChange = useCallback((deviceId: string) => {
    setCurrentCameraId(deviceId);
    switchCamera(deviceId);
    console.log('[Settings] Camera changed to:', deviceId);
  }, [switchCamera]);

  const handleMicChange = useCallback((deviceId: string) => {
    setCurrentMicId(deviceId);
    switchMicrophone(deviceId);
    console.log('[Settings] Mic changed to:', deviceId);
  }, [switchMicrophone]);

  const handleBackgroundChange = useCallback((background: BackgroundOption) => {
    setCurrentBackground(background);
    // TODO: Apply virtual background effect
    console.log('[Settings] Background changed to:', background);
  }, []);

  // Speech recognition callback - always send caption when recognized
  // Each client only recognizes speech from their local microphone
  // The Web Speech API only listens to the default microphone, not speaker output
  const handleSpeechResult = useCallback((text: string, isFinal: boolean) => {
    sendCaption(text, isFinal);
  }, [sendCaption]);

  // Auto-run speech recognition when mic is on (no need to enable captions button)
  // Each user's speech is recognized and sent to all participants
  // The Captions button only controls whether to SHOW captions locally
  useSpeechRecognition(!isAudioMuted, handleSpeechResult);

  // Translation hook - translates captions to target language
  // Note: Transcript saving is handled by useTranscriptSaver above
  const { translatedCaptions } = useTranslation({
    enabled: translationEnabled && isCaptionsEnabled,
    targetLang: translationLang,
    captions: captions,
    meetingId: meetingId,
  });

  // Use translated captions if translation is enabled, otherwise use original captions
  const displayCaptions = translationEnabled ? translatedCaptions : captions;

  // Debug log
  console.log('[Page] displayCaptions:', {
    translationEnabled,
    captionsLength: captions.length,
    translatedCaptionsLength: translatedCaptions.length,
    firstCaption: displayCaptions[0],
    meetingId, // Check if meetingId exists
    userId,
  });

  // Client-side Recording hook (uses MediaRecorder API)
  const {
    isRecording,
    duration: recordingDuration,
    recordedBlob,
    toggleRecording,
    downloadRecording,
    uploadRecording,
    isSupported: isRecordingSupported,
  } = useClientRecording({
    meetingId,
    userId,
    onRecordingComplete: useCallback((blob: Blob, duration: number) => {
      console.log('[Recording] Recording complete:', { size: blob.size, duration });
    }, []),
  });

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

  // Embed mode: Just video grid, no controls (controls are in parent EmbeddedHuddle)
  if (isEmbedMode) {
    return (
      <div className="w-full h-full overflow-hidden" style={{ backgroundColor: 'var(--ts-bg-dark)' }}>
        <MeetingGrid
          participants={participantsArray}
          localParticipant={{
            name: displayName,
            tracks: filteredLocalTracks,
          }}
          isLocalSpeaking={isLocalSpeaking}
          speakingParticipants={speakingParticipants}
          virtualBackground={currentBackground}
          compact
        />
      </div>
    );
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
              <h1 className="font-semibold" style={{ color: 'var(--ts-text-primary)' }}>{roomId}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500 text-sm font-medium">Connected</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--ts-input-bg)' }}>
              <svg className="w-4 h-4" style={{ color: 'var(--ts-text-secondary)' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="font-medium" style={{ color: 'var(--ts-text-primary)' }}>{participantsArray.length + 1}</span>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid or Screen Share View */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          {screenShareTrack ? (
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
              virtualBackground={currentBackground}
            />
          )}
        </div>

        {/* Captions Display - Above controls */}
        <CaptionDisplay
          captions={displayCaptions}
          isEnabled={isCaptionsEnabled}
          showTranslation={translationEnabled}
        />
      </div>

      {/* Reactions Display */}
      <ReactionDisplay
        reactions={reactions.map(r => ({
          id: r.id,
          emoji: r.emoji,
          userName: r.participantName,
          timestamp: r.timestamp,
        } as FloatingReaction))}
        onReactionExpired={removeReaction}
      />

      {/* Recording Indicator */}
      <RecordingIndicator
        isRecording={isRecording}
        duration={recordingDuration}
      />

      {/* Controls */}
      <ControlsToolbar
        isMicOn={!isAudioMuted}
        isVideoOn={!isVideoMuted}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        isCaptionsOn={isCaptionsEnabled}
        onToggleMic={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleRecording={toggleRecording}
        onToggleCaptions={toggleCaptions}
        onSendReaction={sendReaction}
        onShowSettings={handleShowSettings}
        onShowExports={() => setIsExportsOpen(true)}
        hasRecording={!!recordedBlob}
        onLeave={handleLeave}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        currentCameraId={currentCameraId}
        currentMicId={currentMicId}
        currentBackground={currentBackground.value}
        translationEnabled={translationEnabled}
        translationLang={translationLang}
        onCameraChange={handleCameraChange}
        onMicChange={handleMicChange}
        onBackgroundChange={handleBackgroundChange}
        onTranslationEnabledChange={setTranslationEnabled}
        onTranslationLangChange={setTranslationLang}
      />

      {/* Exports Panel */}
      {isExportsOpen && (
        <MeetingExports
          meetingId={meetingId}
          recordedBlob={recordedBlob}
          isRecording={isRecording}
          onDownloadRecording={downloadRecording}
          onClose={() => setIsExportsOpen(false)}
        />
      )}
    </div>
  );
}

export default function MeetingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex items-center justify-center bg-ts-bg-dark">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-ts-orange/20 border-t-ts-orange mx-auto mb-4" />
            <p className="text-ts-text-secondary">Loading...</p>
          </div>
        </div>
      }
    >
      <MeetingPageContent />
    </Suspense>
  );
}
