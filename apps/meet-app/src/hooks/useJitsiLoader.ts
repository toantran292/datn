'use client';
import { useEffect, useState } from 'react';

export function useJitsiLoader() {
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let canceled = false;
        (async () => {
            try {
                if ((window as any).JitsiMeetJS) {
                    (window as any).JitsiMeetJS.init({ disableAudioLevels: true });
                    if (!canceled) setReady(true);
                    return;
                }
                await new Promise<void>((res, rej) => {
                    const s = document.createElement('script');
                    s.src = 'https://meet.jit.si/libs/lib-jitsi-meet.min.js';
                    s.async = true;
                    s.onload = () => res();
                    s.onerror = rej;
                    document.body.appendChild(s);
                });
                (window as any).JitsiMeetJS.init({ disableAudioLevels: true });
                if (!canceled) setReady(true);
            } catch (e:any) {
                if (!canceled) setError(e?.message || String(e));
            }
        })();
        return () => { canceled = true; };
    }, []);

    return { ready, error };
}
