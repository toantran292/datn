'use client';
import React, { useEffect, useRef, useState } from 'react';

type JitsiMeetJS_T = any;
declare global {
    interface Window {
        JitsiMeetJS: JitsiMeetJS_T;
    }
}

const API = process.env.NEXT_PUBLIC_MEET_API!; // vd: http://localhost:40600

function loadScript(src: string) {
    return new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = reject;
        document.body.appendChild(s);
    });
}

export default function MeetCreatePage() {
    const [status, setStatus] = useState<string>('idle');
    const [roomId, setRoomId] = useState<string>('');
    const [conn, setConn] = useState<any>(null);
    const [conference, setConference] = useState<any>(null);
    const [token, setToken] = useState<string>('');
    const [serviceUrl, setServiceUrl] = useState<string>('');

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteContainerRef = useRef<HTMLDivElement>(null);
    const localTracksRef = useRef<any[]>([]);
    const remoteTracksRef = useRef<Record<string, any[]>>({}); // key = participantId

    // Load lib-jitsi-meet từ CDN
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setStatus('loading jitsi lib…');
            await loadScript('https://meet.jit.si/libs/lib-jitsi-meet.min.js');
            if (cancelled) return;
            window.JitsiMeetJS.init({ disableAudioLevels: true });
            setStatus('ready');
        })().catch(err => setStatus(`failed to load jitsi lib: ${err}`));
        return () => { cancelled = true; };
    }, []);

    // Helpers attach/detach track
    function attachTrack(track: any, isLocal = false) {
        if (track.getType() === 'video') {
            const el = isLocal ? localVideoRef.current : document.createElement('video');
            if (!el) return;
            el.autoplay = true;
            el.playsInline = true as any;
            el.muted = isLocal;
            track.attach(el);
            if (!isLocal && remoteContainerRef.current) {
                el.setAttribute('data-track-id', track.getId());
                el.className = 'rounded-xl shadow w-64 h-48 object-cover';
                remoteContainerRef.current.appendChild(el);
            }
        }
        if (track.getType() === 'audio' && !isLocal) {
            const el = document.createElement('audio');
            el.autoplay = true;
            el.setAttribute('data-track-id', track.getId());
            track.attach(el);
            remoteContainerRef.current?.appendChild(el);
        }
    }

    function detachTrack(track: any) {
        const id = track.getId();
        const el = remoteContainerRef.current?.querySelector(`[data-track-id="${id}"]`) as HTMLElement | null;
        if (el) {
            try { track.detach(el); } catch {}
            el.remove();
        }
    }

    async function createRoomAndJoin(asModerator: boolean) {
        try {
            setStatus('creating room…');
            const r1 = await fetch(`${API}/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostUserId: 'u1' }),
            }).then(r => r.json());

            setRoomId(r1.room_id);

            setStatus('fetching meeting token…');
            const r2 = await fetch(`${API}/meet/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: r1.room_id,
                    user: { id: asModerator ? 'u1' : 'u2', name: asModerator ? 'Host' : 'Guest', email: `${asModerator ? 'host' : 'guest'}@example.com` },
                    isModerator: asModerator,
                }),
            }).then(r => r.json());

            setToken(r2.token);
            setServiceUrl(r2.websocket_url); // ví dụ: ws://192.168.100.195:40680/xmpp-websocket

            await connectAndJoin(r1.room_id, r2.token, r2.websocket_url);
        } catch (e: any) {
            console.error(e);
            setStatus(`error: ${e?.message || e}`);
        }
    }

    async function connectAndJoin(room: string, jwt: string, wsUrl: string) {
        setStatus('connecting…');
        const JitsiMeetJS = window.JitsiMeetJS;

        // QUAN TRỌNG: luôn đính token vào serviceUrl
        const withToken = wsUrl + (wsUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(jwt);
        console.log('[meet] serviceUrl =', withToken);

        const connection = new JitsiMeetJS.JitsiConnection(
            null,               // appID (không dùng)
            jwt,                // jwt
            {
                hosts: {
                    domain: 'meet.local',
                    muc: 'muc.meet.local',
                    focus: 'focus.meet.local',
                },
                serviceUrl: withToken,         // WS có ?token=...
                // enableLipSync: true,        // tuỳ chọn
            }
        );

        connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnected);
        connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, (e:any) => {
            console.error('CONNECTION_FAILED', e);
            setStatus('connection failed');
        });
        connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, () => {
            setStatus('disconnected');
        });

        connection.connect();
        setConn(connection);

        async function onConnected() {
            setStatus('connected → joining room…');

            const conf = connection.initJitsiConference(room, {
                openBridgeChannel: 'websocket',
                p2p: { enabled: false },
                clientNode: 'meet-demo',
            });

            // Events
            conf.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, () => setStatus('joined room'));
            conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track:any) => {
                if (track.isLocal()) return;
                attachTrack(track, false);
                const pid = track.getParticipantId();
                (remoteTracksRef.current[pid] ||= []).push(track);
            });
            conf.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track:any) => detachTrack(track));
            conf.on(JitsiMeetJS.events.conference.USER_LEFT, (id:string) => {
                (remoteTracksRef.current[id] || []).forEach(detachTrack);
                delete remoteTracksRef.current[id];
            });
            conf.on(JitsiMeetJS.events.conference.CONFERENCE_FAILED, (e:any) => {
                console.error('CONFERENCE_FAILED', e);
                setStatus('conference failed');
            });

            conf.join();
            setConference(conf);

            // Local media
            await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            const tracks = await JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] });
            localTracksRef.current = tracks;
            tracks.forEach((t:any) => { conf.addTrack(t); attachTrack(t, true); });
        }
    }

    // cleanup
    useEffect(() => {
        return () => {
            try {
                localTracksRef.current.forEach((t) => { try { t.dispose(); } catch {} });
                conference?.leave();
                conn?.disconnect();
            } catch {}
        };
    }, [conference, conn]);

    return (
        <div style={{ padding: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Meet – demo</h1>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={() => createRoomAndJoin(true)}>Join as Host</button>
                <button onClick={() => createRoomAndJoin(false)}>Join as Guest</button>
                <button
                    onClick={() => {
                        const v = localTracksRef.current.find((t) => t.getType() === 'video');
                        if (v) v.isMuted() ? v.unmute() : v.mute();
                    }}
                >
                    Toggle Cam
                </button>
                <button
                    onClick={() => {
                        const a = localTracksRef.current.find((t) => t.getType() === 'audio');
                        if (a) a.isMuted() ? a.unmute() : a.mute();
                    }}
                >
                    Toggle Mic
                </button>
            </div>

            <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.8 }}>
                <div>Status: {status}</div>
                {roomId && <div>Room: <code>{roomId}</code></div>}
                {serviceUrl && <div>WS: <code>{serviceUrl}</code></div>}
                {token && <div style={{maxWidth: 600, wordBreak: 'break-all'}}>JWT: <code>{token.slice(0,32)}…</code></div>}
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
                <div>
                    <div style={{ marginBottom: 6, fontWeight: 600 }}>Local</div>
                    <video ref={localVideoRef} playsInline className="rounded-xl shadow" style={{ width: 320, height: 240, background: '#111' }} />
                </div>

                <div>
                    <div style={{ marginBottom: 6, fontWeight: 600 }}>Remote</div>
                    <div ref={remoteContainerRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} />
                </div>
            </div>
        </div>
    );
}
