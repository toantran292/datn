'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useJitsiLoader } from '@/hooks/useJitsiLoader';
import { useMeetingConnection } from '@/hooks/useMeetingConnection';
import { useConferenceTracks } from '@/hooks/useConferenceTracks';
import { createRoom, getMeetingToken } from '@/services/meetingApi';
import { buildInviteUrl, copyToClipboard } from '@/lib/invite';
import type { ViewMode } from '@/lib/types';
import Controls from '@/components/Controls';
import LocalVideo from '@/components/LocalVideo';
import RemoteGrid, { attachRemoteVideo, detachRemoteVideo } from '@/components/RemoteGrid';

export default function MeetCreatePage() {
    const { ready, error } = useJitsiLoader();
    const { status, setStatus, connectAndJoin, leave, conferenceRef } = useMeetingConnection();

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteContainerRef = useRef<HTMLDivElement | null>(null);

    const [roomId, setRoomId] = useState('');
    const [inviteUrl, setInviteUrl] = useState('');
    const [serviceUrl, setServiceUrl] = useState('');
    const [jwt, setJwt] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [dominantId, setDominantId] = useState<string>();

    const { wireConferenceEvents, addLocalAV, toggleScreenShare, disposeLocal } = useConferenceTracks({
        attachRemote: (t:any) => remoteContainerRef.current && attachRemoteVideo(t, remoteContainerRef.current, viewMode),
        detachRemote: (t:any) => detachRemoteVideo(t, remoteContainerRef.current),
        attachLocal : (t:any) => { if (t.getType() === 'video') t.attach(localVideoRef.current!); },
        onDominant  : setDominantId,
        setStatus,
    });

    useEffect(() => { if (error) setStatus('failed to load jitsi lib: '+error); }, [error, setStatus]);

    async function join(asModerator:boolean) {
        if (!ready) return;
        setStatus('creating room…');
        const r1 = await createRoom('u1');
        setRoomId(r1.room_id);
        const url = buildInviteUrl(r1.room_id);
        setInviteUrl(url);

        setStatus('fetching meeting token…');
        const r2 = await getMeetingToken({
            room_id: r1.room_id,
            user: { id: asModerator?'u1':'u2', name: asModerator?'Host':'Guest', email: `${asModerator?'host':'guest'}@example.com` },
            isModerator: asModerator,
        });
        setJwt(r2.token); setServiceUrl(r2.websocket_url);

        const conf = await connectAndJoin(r1.room_id, r2.token, r2.websocket_url);
        wireConferenceEvents(conf);
        await addLocalAV(conf);
    }

    async function onLeave() {
        await disposeLocal(conferenceRef.current);
        await leave(conferenceRef.current);
    }

    async function copyInvite() {
        if (!inviteUrl) return;
        const ok = await copyToClipboard(inviteUrl);
        setStatus(ok ? 'invite link copied' : 'copy failed');
    }

    return (
        <div style={{ padding: 16 }}>
            <h1>Meet – demo</h1>

            <Controls
                onJoinHost={() => join(true)}
                onJoinGuest={() => join(false)}
                onLeave={onLeave}
                onShare={() => toggleScreenShare(conferenceRef.current)}
                onCopyInvite={copyInvite}
                toggleView={() => setViewMode(v => v === 'grid' ? 'speaker' : 'grid')}
                inviteUrl={inviteUrl}
                viewLabel={viewMode === 'grid' ? 'Speaker view' : 'Grid view'}
            />

            <div style={{ marginBottom: 8, fontSize: 13, opacity: .8 }}>
                <div>Status: {status}</div>
                {roomId && <div>Room: <code>{roomId}</code></div>}
                {serviceUrl && <div>WS: <code>{serviceUrl}</code></div>}
                {jwt && <div>JWT: <code>{jwt.slice(0, 24)}…</code></div>}
            </div>

            <div style={{ display:'flex', gap:16 }}>
                <LocalVideo videoRef={localVideoRef} />
                <RemoteGrid containerRef={remoteContainerRef} />
            </div>
        </div>
    );
}
