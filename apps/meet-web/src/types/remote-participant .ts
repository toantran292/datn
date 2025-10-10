export type RemoteP = {
    id: string;
    name: string;
    videoTrack?: any | null;
    audioTrack?: any | null;
    isVideoOn?: boolean;
    isMuted?: boolean;
    // ... các field khác (caption, avatar,…)
};