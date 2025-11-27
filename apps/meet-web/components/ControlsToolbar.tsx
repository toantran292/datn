import { motion } from 'motion/react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface ControlsToolbarProps {
  isMicOn: boolean;
  isVideoOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
}

export function ControlsToolbar({
  isMicOn,
  isVideoOn,
  onToggleMic,
  onToggleVideo,
  onLeave,
}: ControlsToolbarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        className="flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl border border-gray-700"
        style={{
          background: 'rgba(17, 24, 39, 0.95)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 196, 171, 0.2)',
        }}
      >
        {/* Mic control */}
        <ControlButton
          icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          active={isMicOn}
          onClick={onToggleMic}
          activeColor="orange"
          label="Mic"
        />

        {/* Video control */}
        <ControlButton
          icon={isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          active={isVideoOn}
          onClick={onToggleVideo}
          activeColor="teal"
          label="Camera"
        />

        {/* Divider */}
        <div className="w-px h-8 bg-gray-700" />

        {/* Leave button */}
        <button
          onClick={onLeave}
          className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
        >
          <PhoneOff className="w-5 h-5" />
          Leave
        </button>
      </div>
    </motion.div>
  );
}

interface ControlButtonProps {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  activeColor: 'orange' | 'teal';
  label: string;
}

function ControlButton({ icon, active, onClick, activeColor, label }: ControlButtonProps) {
  const bgColor = active
    ? activeColor === 'orange'
      ? 'bg-ts-orange'
      : 'bg-ts-teal'
    : 'bg-gray-700';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`w-12 h-12 rounded-xl ${bgColor} hover:opacity-90 text-white transition-all duration-200 flex items-center justify-center shadow-lg relative group`}
      title={label}
    >
      {icon}

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </div>
    </motion.button>
  );
}
