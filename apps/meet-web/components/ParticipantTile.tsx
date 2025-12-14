'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { JitsiAudio } from './JitsiAudio';
import { MicOff, Mic } from 'lucide-react';
import type { JitsiTrack } from '@/types/jitsi';

interface ParticipantTileProps {
  id: string;
  name: string;
  tracks: JitsiTrack[];
  isLocal?: boolean;
  size?: 'small' | 'medium' | 'large';
  isSpeaking?: boolean;
}

/**
 * Simple participant tile component.
 * Renders video and audio for a participant.
 */
export function ParticipantTile({
  id,
  name,
  tracks,
  isLocal = false,
  size = 'medium',
  isSpeaking = false,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Find video track (camera only, not desktop)
  const videoTrack = useMemo(() => {
    const vTrack = tracks.find(t => {
      if (t.getType() !== 'video') return false;
      const tAny = t as any;
      const isDesktop = tAny.getVideoType?.() === 'desktop' || tAny.videoType === 'desktop';
      return !isDesktop;
    });
    return vTrack;
  }, [tracks]);

  // Find audio track
  const audioTrack = useMemo(() => {
    return tracks.find(t => t.getType() === 'audio');
  }, [tracks]);

  // Check mute states
  const isAudioMuted = !audioTrack || audioTrack.isMuted();

  // Check video mute state - for local use isMuted(), for remote check actual stream
  useEffect(() => {
    if (!videoTrack) {
      setIsVideoMuted(true);
      return;
    }

    const isLocalTrack = videoTrack.isLocal();

    if (isLocalTrack) {
      // For local tracks, isMuted() is reliable
      setIsVideoMuted(videoTrack.isMuted());
    } else {
      // For remote tracks, check if MediaStreamTrack is enabled
      try {
        const stream = (videoTrack as any).getOriginalStream?.();
        if (stream) {
          const videoTracks = stream.getVideoTracks();
          if (videoTracks.length > 0) {
            const mediaTrack = videoTracks[0];
            // Remote is muted if track is not enabled or not live
            const isMuted = !mediaTrack.enabled || mediaTrack.readyState !== 'live';
            setIsVideoMuted(isMuted);
            return;
          }
        }
      } catch (e) {
        // Fallback to isMuted()
      }
      setIsVideoMuted(videoTrack.isMuted());
    }
  }, [videoTrack, tracks]); // tracks dependency to re-check on mute change

  // Attach video track directly - following official Jitsi example
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!videoTrack) {
      console.log(`[ParticipantTile] ${name} - no video track`);
      setShowVideo(false);
      return;
    }

    const trackId = videoTrack.getId?.() || 'unknown';
    const isLocalTrack = videoTrack.isLocal();
    console.log(`[ParticipantTile] ${name} - attaching video, trackId: ${trackId}, isLocal: ${isLocalTrack}`);

    // Attach track - this is the key step from official example
    videoTrack.attach(videoEl);

    // For remote tracks, also try to get the stream directly
    if (!isLocalTrack) {
      try {
        const stream = (videoTrack as any).getOriginalStream?.();
        if (stream && !videoEl.srcObject) {
          console.log(`[ParticipantTile] ${name} - manually setting srcObject from getOriginalStream`);
          videoEl.srcObject = stream;
        }
      } catch (e) {
        // Ignore
      }
    }

    // Check video - if we have dimensions AND video is playing, show video
    const checkVideo = () => {
      const width = videoEl.videoWidth;
      const height = videoEl.videoHeight;

      if (width > 0 && height > 0) {
        // Also check if local track is muted
        if (isLocalTrack && videoTrack.isMuted()) {
          setShowVideo(false);
          return false;
        }
        setShowVideo(true);
        return true;
      }
      setShowVideo(false);
      return false;
    };

    // Listen for video events
    const handlePlaying = () => {
      console.log(`[ParticipantTile] ${name} - video playing event`);
      checkVideo();
    };

    const handleLoadedMetadata = () => {
      console.log(`[ParticipantTile] ${name} - video loadedmetadata, width: ${videoEl.videoWidth}`);
      checkVideo();
    };

    const handleCanPlay = () => {
      console.log(`[ParticipantTile] ${name} - video canplay event`);
      checkVideo();
    };

    videoEl.addEventListener('playing', handlePlaying);
    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('canplay', handleCanPlay);

    // Check multiple times with delays
    checkVideo();
    const t1 = setTimeout(checkVideo, 100);
    const t2 = setTimeout(checkVideo, 500);
    const t3 = setTimeout(checkVideo, 1000);
    const t4 = setTimeout(checkVideo, 2000);

    // Keep checking periodically for remote tracks
    let checkCount = 0;
    const intervalId = setInterval(() => {
      checkCount++;

      if (checkVideo()) {
        clearInterval(intervalId);
        return;
      }

      // Only log first few checks
      if (checkCount <= 5) {
        console.log(`[ParticipantTile] ${name} - check #${checkCount}: ${videoEl.videoWidth}x${videoEl.videoHeight}, readyState=${videoEl.readyState}`);
      }

      // Try to play if paused
      if (videoEl.paused && videoEl.srcObject) {
        videoEl.play().catch(() => {});
      }

      // Stop checking after 15 seconds
      if (checkCount > 30) {
        clearInterval(intervalId);
      }
    }, 500);

    // Try to play
    videoEl.play().catch(() => {});

    // Listen for resize event
    const handleResize = () => {
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        console.log(`[ParticipantTile] ${name} - resize event: ${videoEl.videoWidth}x${videoEl.videoHeight}`);
        checkVideo();
      }
    };
    videoEl.addEventListener('resize', handleResize);

    // Listen for track mute/unmute events
    const handleTrackMuteChanged = () => {
      const muted = videoTrack.isMuted();
      console.log(`[ParticipantTile] ${name} - track mute changed: ${muted}`);
      if (muted) {
        setShowVideo(false);
      } else {
        // Re-check video after unmute
        setTimeout(checkVideo, 100);
      }
    };

    // Add event listener for mute change if available
    try {
      (videoTrack as any).addEventListener?.('track.mute_changed', handleTrackMuteChanged);
    } catch (e) {
      // Ignore if not available
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(intervalId);
      videoEl.removeEventListener('playing', handlePlaying);
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.removeEventListener('canplay', handleCanPlay);
      videoEl.removeEventListener('resize', handleResize);
      try {
        (videoTrack as any).removeEventListener?.('track.mute_changed', handleTrackMuteChanged);
      } catch (e) {
        // Ignore
      }
      console.log(`[ParticipantTile] ${name} - detaching video`);
      videoTrack.detach(videoEl);
      setShowVideo(false);
    };
  }, [videoTrack, name, tracks]); // tracks dependency to re-run when mute state changes

  // Get initials for avatar fallback
  const initials = name
    .split(' ')
    .map(n => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  // Size classes
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-4xl',
    large: 'text-5xl',
  };

  return (
    <div className="flex flex-col items-center gap-3 relative">
      {/* Speaking indicator badge */}
      {isSpeaking && (
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--ts-orange)',
            boxShadow: '0 2px 8px rgba(255, 136, 0, 0.4)',
          }}
        >
          <Mic className="w-3 h-3 text-white" />
          <span className="text-xs font-medium text-white">Speaking</span>
        </div>
      )}

      {/* Video/Avatar container */}
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden relative`}
        style={{
          backgroundColor: 'var(--ts-card-surface)',
          border: isSpeaking ? '3px solid var(--ts-orange)' : '2px solid var(--ts-border)',
          boxShadow: isSpeaking ? '0 0 20px rgba(255, 136, 0, 0.4)' : 'none',
          transition: 'border 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Video element - always render */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: isLocal ? 'scaleX(-1)' : 'none',
            opacity: showVideo ? 1 : 0,
            zIndex: showVideo ? 1 : 0,
          }}
        />

        {/* Avatar fallback when no video */}
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-ts-orange/20 to-ts-teal/20"
          style={{
            opacity: !showVideo ? 1 : 0,
            zIndex: !showVideo ? 1 : 0,
          }}
        >
          <span className={`font-bold text-white ${textSizeClasses[size]}`}>
            {initials}
          </span>
        </div>

        {/* Mute indicator */}
        {isAudioMuted && size !== 'small' && (
          <div
            className="absolute bottom-1 right-1 rounded-full p-1.5 border"
            style={{
              backgroundColor: 'var(--ts-card-surface)',
              borderColor: 'var(--ts-border)',
            }}
          >
            <MicOff className="w-3 h-3" style={{ color: 'var(--ts-text-secondary)' }} />
          </div>
        )}
      </div>

      {/* Audio element for remote participants (hidden, for playback only) */}
      {!isLocal && audioTrack && !isAudioMuted && (
        <JitsiAudio track={audioTrack} />
      )}

      {/* Name label */}
      <div
        className="px-3 py-1.5 rounded-lg backdrop-blur-sm"
        style={{ background: 'rgba(17, 24, 39, 0.8)' }}
      >
        <p className="text-sm text-white whitespace-nowrap">
          {isLocal ? `${name} (You)` : name}
        </p>
      </div>
    </div>
  );
}
