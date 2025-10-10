'use client';
import { useEffect, useState } from 'react';

export function useJitsiLoader() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if ((window as any).JitsiMeetJS) {
            setReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/libs/lib-jitsi-meet.min.js';
        script.async = true;

        script.onload = () => {
            const JM = (window as any).JitsiMeetJS;

            // 🟢 Quan trọng: bật audio level tracking
            JM.init({
                disableAudioLevels: false,
                enableNoAudioDetection: true,
                enableNoisyMicDetection: false,
            });

            JM.setLogLevel(JM.logLevels.WARN);
            console.log('Jitsi Meet JS loaded successfully');
            setReady(true);
        };

        script.onerror = () => console.error('Failed to load Jitsi Meet JS');
        document.head.appendChild(script);

        return () => {
            script.remove?.();
        };
    }, []);

    return { ready };
}
