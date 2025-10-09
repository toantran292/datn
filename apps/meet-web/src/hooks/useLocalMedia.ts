import { useCallback, useEffect, useRef, useState } from 'react';

export function useLocalMedia() {
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number | null>(null);

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
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = ctx;
                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 2048;
                analyserRef.current = analyser;
                source.connect(analyser);

                const data = new Uint8Array(analyser.frequencyBinCount);
                const loop = () => {
                    analyser.getByteTimeDomainData(data);
                    // compute RMS-like level 0..100
                    let sum = 0;
                    for (let i = 0; i < data.length; i++) {
                        const v = (data[i] - 128) / 128;
                        sum += v * v;
                    }
                    const rms = Math.sqrt(sum / data.length);
                    setAudioLevel(Math.min(100, Math.round(rms * 200)));
                    rafRef.current = requestAnimationFrame(loop);
                };
                rafRef.current = requestAnimationFrame(loop);
            } catch { }
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
        try { if (rafRef.current) cancelAnimationFrame(rafRef.current); } catch { }
        try { analyserRef.current?.disconnect(); } catch { }
        try { audioContextRef.current?.close(); } catch { }
        analyserRef.current = null;
        audioContextRef.current = null;
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
            try { if (rafRef.current) cancelAnimationFrame(rafRef.current); } catch { }
            try { analyserRef.current?.disconnect(); } catch { }
            try { audioContextRef.current?.close(); } catch { }
        };
    }, []);

    return {
        isVideoOn,
        isMicOn,
        videoStream: videoStreamRef.current,
        audioStream: audioStreamRef.current,
        audioLevel,
        enableVideo,
        disableVideo,
        toggleVideo,
        enableMic,
        disableMic,
        toggleMic,
    } as const;
}


