import { useCallback, useEffect, useRef, useState } from 'react';

export function useScreenShare() {
    const [isSharing, setIsSharing] = useState(false);
    const screenStreamRef = useRef<MediaStream | null>(null);

    const startShare = useCallback(async () => {
        if (screenStreamRef.current) {
            setIsSharing(true);
            return screenStreamRef.current;
        }
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = stream;
        setIsSharing(true);
        // auto stop when user ends from browser UI
        stream.getVideoTracks().forEach((t) => {
            t.addEventListener('ended', () => {
                stopShare();
            });
        });
        return stream;
    }, []);

    const stopShare = useCallback(() => {
        const s = screenStreamRef.current;
        if (s) {
            s.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        setIsSharing(false);
    }, []);

    const toggleShare = useCallback(async () => {
        if (isSharing) {
            stopShare();
            return false;
        }
        await startShare();
        return true;
    }, [isSharing, startShare, stopShare]);

    useEffect(() => {
        return () => {
            try { screenStreamRef.current?.getTracks().forEach(t => t.stop()); } catch { }
        };
    }, []);

    return {
        isSharing,
        screenStream: screenStreamRef.current,
        startShare,
        stopShare,
        toggleShare,
    } as const;
}


