'use client';
import { useEffect, useRef } from 'react';
import { useJitsi } from '@/hooks/useJitsi';

export default function MeetBare({ roomId, jwt, user }:{
    roomId: string; jwt: string; user: { id:string; name:string }
}) {
    const { localVideoRef, remoteVideos, toggleAudio, toggleVideo } =
        useJitsi({ roomId, jwt, displayName: user.name });

    const remoteWrapRef = useRef<HTMLDivElement|null>(null);
    useEffect(() => {
        if (!remoteWrapRef.current) return;
        remoteWrapRef.current.innerHTML = '';
        remoteVideos.forEach(v => remoteWrapRef.current!.appendChild(v.ref));
    }, [remoteVideos]);

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <button className="btn" onClick={toggleVideo}>Cam</button>
                <button className="btn" onClick={toggleAudio}>Mic</button>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full rounded bg-black/20" />
                <div ref={remoteWrapRef} className="col-span-2 grid grid-cols-2 gap-2" />
            </div>
        </div>
    );
}
