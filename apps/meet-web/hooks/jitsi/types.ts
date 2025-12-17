import type { JitsiTrack } from '@/types/jitsi';

/**
 * Participant in a Jitsi conference
 */
export interface Participant {
  id: string;
  name: string;
  tracks: JitsiTrack[];
  isSpeaking?: boolean;
}

/**
 * Reaction event from a participant
 */
export interface ReactionEvent {
  id: string;
  emoji: string;
  participantId: string;
  participantName: string;
  timestamp: number;
}

/**
 * Caption event from speech recognition
 */
export interface CaptionEvent {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

/**
 * Conference state
 */
export interface ConferenceState {
  isJoined: boolean;
  participants: Map<string, Participant>;
  localTracks: JitsiTrack[];
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  screenShareTrack: JitsiTrack | null;
  screenShareParticipantId: string | null;
  dominantSpeakerId: string | null;
  isLocalSpeaking: boolean;
  speakingParticipants: Set<string>;
  reactions: ReactionEvent[];
  captions: CaptionEvent[];
  isCaptionsEnabled: boolean;
}

/**
 * Conference actions
 */
export interface ConferenceActions {
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  leaveConference: () => Promise<void>;
  sendReaction: (emoji: string) => void;
  removeReaction: (reactionId: string) => void;
  toggleCaptions: () => void;
  sendCaption: (text: string, isFinal: boolean) => void;
}

/**
 * Audio level threshold for speaking detection
 */
export const SPEAKING_THRESHOLD = 0.1;

/**
 * Local audio threshold for speaking detection
 */
export const LOCAL_AUDIO_THRESHOLD = 20;

/**
 * Timeout for speaking indicator (ms)
 */
export const SPEAKING_TIMEOUT = 600;
