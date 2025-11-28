import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { JitsiTrack } from '@/types/jitsi';

interface RemoteVideoProps {
  name: string;
  tracks: JitsiTrack[];
}

export function RemoteVideo({ name, tracks }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const videoTrack = tracks.find(t => t.getType() === 'video');
  const audioTrack = tracks.find(t => t.getType() === 'audio');
  const videoTrackId = videoTrack?.getId();
  const audioTrackId = audioTrack?.getId();

  useEffect(() => {
    if (!videoTrack || !videoRef.current) return;

    try {
      videoTrack.attach(videoRef.current);
    } catch (err) {
      console.error('[RemoteVideo] Error attaching video:', err);
    }

    return () => {
      if (videoRef.current && videoTrack) {
        try {
          videoTrack.detach(videoRef.current);
        } catch (err) {
          console.error('[RemoteVideo] Error detaching video:', err);
        }
      }
    };
  }, [videoTrackId, name]);

  useEffect(() => {
    if (!audioTrack || !audioRef.current) return;

    try {
      audioTrack.attach(audioRef.current);
    } catch (err) {
      console.error('[RemoteVideo] Error attaching audio:', err);
    }

    return () => {
      if (audioRef.current && audioTrack) {
        try {
          audioTrack.detach(audioRef.current);
        } catch (err) {
          console.error('[RemoteVideo] Error detaching audio:', err);
        }
      }
    };
  }, [audioTrackId, name]);

  const hasVideo = videoTrack && !videoTrack.isMuted();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-lg"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        className={`w-full h-full object-cover ${hasVideo ? 'block' : 'hidden'}`}
      />

      {!hasVideo && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ts-orange/20 to-ts-teal/20">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ts-orange to-ts-teal flex items-center justify-center text-4xl font-bold text-white shadow-xl">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      <audio ref={audioRef} autoPlay />

      <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
        <p className="text-white text-sm font-medium">{name}</p>
      </div>
    </motion.div>
  );
}
