import { motion } from "framer-motion";
import type { JitsiTrack } from '@/types/jitsi';
import { Video } from './Video';

interface LocalVideoProps {
  name: string;
  tracks: JitsiTrack[];
}

export function LocalVideo({ name, tracks }: LocalVideoProps) {
  const videoTrack = tracks.find(t => t.getType() === 'video');
  const hasVideo = videoTrack && !videoTrack.isMuted();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-lg"
    >
      <div className={`w-full h-full ${!hasVideo ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
        <Video
          videoTrack={videoTrack}
          className="w-full h-full object-cover"
          muted={true}
          autoPlay={true}
        />
      </div>

      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ts-orange/20 to-ts-teal/20 z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ts-orange to-ts-teal flex items-center justify-center text-4xl font-bold text-white shadow-xl">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
        <p className="text-white text-sm font-medium">{name} (You)</p>
      </div>
    </motion.div>
  );
}
