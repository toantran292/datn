// apps/meet-app/src/components/MeetContainer.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

function loadJitsiScript(src: string) {
    return new Promise<void>((resolve, reject) => {
        if (typeof window !== 'undefined' && (window as any).JitsiMeetExternalAPI) {
            return resolve(); // đã có
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load external_api.js'));
        document.body.appendChild(s);
    });
}

export default function MeetContainer({ roomId, jwt }: { roomId: string; jwt: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null); // tránh init 2 lần

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const host = process.env.NEXT_PUBLIC_JITSI_HOST!;
            // await loadJitsiScript(`http://${host}/external_api.js`); // http cho localhost
            await loadJitsiScript(`/jitsi/external_api.js`);
            if (cancelled || apiRef.current) return;

            const websocket = process.env.NEXT_PUBLIC_MEET_WS!;
            // @ts-ignore
            const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
            const api = new JitsiMeetExternalAPI(host, {
                roomName: roomId,
                parentNode: ref.current!,
                jwt,
                configOverwrite: { websocket, p2p: { enabled: false } },
            });
            apiRef.current = api;
        })().catch(console.error);

        return () => { apiRef.current?.dispose?.(); apiRef.current = null; cancelled = true; };
    }, [roomId, jwt]);

    return (
        <>
            <div className="flex gap-2 mb-3">
                <button className="btn" onClick={() => apiRef.current?.executeCommand('toggleVideo')}>Cam</button>
                <button className="btn" onClick={() => apiRef.current?.executeCommand('toggleAudio')}>Mic</button>
                <button className="btn" onClick={() => apiRef.current?.executeCommand('toggleShareScreen')}>Share</button>
                <button className="btn" onClick={() => apiRef.current?.executeCommand('toggleTileView')}>Grid/Speaker</button>
                <button className="btn" onClick={() => apiRef.current?.hangup()}>Leave</button>
            </div>
            <div ref={ref} className="h-[75vh] w-full rounded-2xl border bg-black/5" />
        </>
    );
}
