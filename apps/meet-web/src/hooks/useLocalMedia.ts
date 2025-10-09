import { useCallback, useEffect, useRef, useState } from 'react';

export function useLocalMedia() {
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);

    const enableVideo = useCallback(async () => {
        if (!videoStreamRef.current) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoStreamRef.current = stream;
        }
        setIsVideoOn(true);
        return videoStreamRef.current;
    }, []);

    const disableVideo = useCallback(() => {
        const s = videoStreamRef.current;
        if (s) {
            s.getTracks().forEach(t => t.stop());
            videoStreamRef.current = null;
        }
        setIsVideoOn(false);
    }, []);

    const toggleVideo = useCallback(async () => {
        if (isVideoOn) {
            disableVideo();
            return false;
        }
        await enableVideo();
        return true;
    }, [isVideoOn, enableVideo, disableVideo]);

    const enableMic = useCallback(async () => {
        if (!audioStreamRef.current) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            audioStreamRef.current = stream;
        }
        setIsMicOn(true);
        return audioStreamRef.current;
    }, []);

    const disableMic = useCallback(() => {
        const s = audioStreamRef.current;
        if (s) {
            s.getTracks().forEach(t => t.stop());
            audioStreamRef.current = null;
        }
        setIsMicOn(false);
    }, []);

    const toggleMic = useCallback(async () => {
        if (isMicOn) {
            disableMic();
            return false;
        }
        await enableMic();
        return true;
    }, [isMicOn, enableMic, disableMic]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            try { videoStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
            try { audioStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
        };
    }, []);

    return {
        isVideoOn,
        isMicOn,
        videoStream: videoStreamRef.current,
        audioStream: audioStreamRef.current,
        enableVideo,
        disableVideo,
        toggleVideo,
        enableMic,
        disableMic,
        toggleMic,
    } as const;
}


