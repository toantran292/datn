import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { JitsiTrack } from '@/types/jitsi';

interface ParticipantVideoProps {
  name: string;
  tracks: JitsiTrack[];
  isLocal?: boolean;
}

export function ParticipantVideo({ name, tracks, isLocal = false }: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use track IDs as dependencies to ensure re-render when tracks change
  const videoTrack = tracks.find(t => t.getType() === 'video');
  const audioTrack = tracks.find(t => t.getType() === 'audio');
  const videoTrackId = videoTrack?.getId();
  const audioTrackId = audioTrack?.getId();
  // Include mute state in dependencies to re-attach when mute changes
  const videoMuted = videoTrack?.isMuted();
  const audioMuted = audioTrack?.isMuted();

  useEffect(() => {
    // Attach video track
    if (videoRef.current && videoTrack) {
      try {
        videoTrack.attach(videoRef.current);
      } catch (err) {
        console.error('[ParticipantVideo] Error attaching video:', err);
      }
    }

    return () => {
      if (videoRef.current && videoTrack) {
        try {
          videoTrack.detach(videoRef.current);
        } catch (err) {
          console.error('[ParticipantVideo] Error detaching video:', err);
        }
      }
    };
  }, [videoTrack, videoTrackId, videoMuted, name, tracks]);

  useEffect(() => {
    // Attach audio track
    if (audioRef.current && audioTrack && !isLocal) {
      try {
        audioTrack.attach(audioRef.current);
      } catch (err) {
        console.error('[ParticipantVideo] Error attaching audio:', err);
      }
    }

    return () => {
      if (audioRef.current && audioTrack) {
        try {
          audioTrack.detach(audioRef.current);
        } catch (err) {
          console.error('[ParticipantVideo] Error detaching audio:', err);
        }
      }
    };
  }, [audioTrack, audioTrackId, audioMuted, isLocal, name, tracks]);

  // Show video element only if track exists AND is not muted
  // When muted (camera off), show avatar instead
  const hasVideo = videoTrack && !videoTrack.isMuted();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-lg"
    >
      {/* Always render video element so ref is available, hide when no video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${hasVideo ? 'block' : 'hidden'}`}
      />

      {/* Show avatar when no video */}
      {!hasVideo && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ts-orange/20 to-ts-teal/20">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ts-orange to-ts-teal flex items-center justify-center text-4xl font-bold text-white shadow-xl">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {!isLocal && <audio ref={audioRef} autoPlay />}

      {/* Name label */}
      <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
        <p className="text-white text-sm font-medium">
          {isLocal ? `${name} (You)` : name}
        </p>
      </div>
    </motion.div>
  );
}
