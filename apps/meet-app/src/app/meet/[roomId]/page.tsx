'use client';
import React, { useEffect, useRef } from 'react';
import { useJitsiLoader } from '@/hooks/useJitsiLoader';
import { useMeetingConnection } from '@/hooks/useMeetingConnection';
import { useConferenceTracks } from '@/hooks/useConferenceTracks';
import { getMeetingToken } from '@/services/meetingApi';
import LocalVideo from '@/components/LocalVideo';
import RemoteGrid, { attachRemoteVideo, detachRemoteVideo } from '@/components/RemoteGrid';

export default function MeetJoinPage({ params, searchParams }: any) {
    const room = params.roomId as string;
    const role = (searchParams?.role || 'guest') as 'host'|'guest';

    const { ready } = useJitsiLoader();
    const { status, setStatus, connectAndJoin, leave, conferenceRef } = useMeetingConnection();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteContainerRef = useRef<HTMLDivElement>(null);
    const { wireConferenceEvents, addLocalAV, disposeLocal } = useConferenceTracks({
        attachRemote: (t:any) => remoteContainerRef.current && attachRemoteVideo(t, remoteContainerRef.current, 'grid'),
        detachRemote: (t:any) => detachRemoteVideo(t, remoteContainerRef.current),
        attachLocal : (t:any) => { if (t.getType() === 'video') t.attach(localVideoRef.current!); },
        setStatus,
    });

    useEffect(() => {
        if (!ready) return;
        (async () => {
            setStatus('fetching token…');
            const r2 = await getMeetingToken({
                room_id: room,
                user: { id: role==='host'?'u1':'u2', name: role==='host'?'Host':'Guest' },
                isModerator: role==='host',
            });
            const conf = await connectAndJoin(room, r2.token, r2.websocket_url);
            wireConferenceEvents(conf);
            await addLocalAV(conf);
        })();
        return () => { (async ()=>{ await disposeLocal(conferenceRef.current); await leave(conferenceRef.current); })(); };
    }, [ready, room, role]);

    return (
        <div style={{ padding: 16 }}>
            <h1>Room: {room}</h1>
            <div>Status: {status}</div>
            <button onClick={async()=>{ await disposeLocal(conferenceRef.current); await leave(conferenceRef.current); }}>Leave</button>
            <div style={{ display:'flex', gap:16, marginTop:12 }}>
                <LocalVideo videoRef={localVideoRef} />
                <RemoteGrid containerRef={remoteContainerRef} />
            </div>
        </div>
    );
}
