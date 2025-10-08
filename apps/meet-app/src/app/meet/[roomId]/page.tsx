'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useJitsiLoader } from '@/hooks/useJitsiLoader';
import { useMeetingConnection } from '@/hooks/useMeetingConnection';
import { useConferenceTracks } from '@/hooks/useConferenceTracks';
import { getMeetingToken } from '@/services/meetingApi';
import LocalVideo from '@/components/LocalVideo';
import { attachRemoteShare, detachRemoteShare } from '@/components/RemoteGrid';
import MeetingTopBar from '@/components/MeetingTopBar';
import BottomControlsBar from '@/components/BottomControlsBar';
import ShareStage from '@/components/ShareStage';
import PeopleSidebar from '@/components/PeopleSidebar';

type Dev = MediaDeviceInfo & { deviceId: string; kind: string; label: string };

export default function MeetChatPage() {
    const sp = useSearchParams();
    const router = useRouter();

    // ---- query params ----
    const subject: 'chat' = 'chat';
    const asGuest = sp.get('asGuest') === '1';
    const rawUserId = sp.get('userId') ?? 'user-1';
    const userId = asGuest ? `guest-${crypto.randomUUID()}` : rawUserId;
    const chatId = sp.get('chatId') ?? '';

    let camFromQuery = sp.get('cam') ?? undefined;
    let micFromQuery = sp.get('mic') ?? undefined;
    const startCam = sp.get('camOn') === '1';
    const startMic = sp.get('micOn') === '1';

    const { ready } = useJitsiLoader();
    const { status, setStatus, connectAndJoin, leave, conferenceRef } = useMeetingConnection();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteContainerRef = useRef<HTMLDivElement>(null); // will be placed into grid or strip depending on hasShare
    const shareContainerRef = useRef<HTMLDivElement>(null);
    const [hasShare, setHasShare] = useState(false);
    const gridHostRef = useRef<HTMLDivElement>(null);
    const stripHostRef = useRef<HTMLDivElement>(null);

    const [camOn, setCamOn] = useState(!!startCam);
    const [micOn, setMicOn] = useState(!!startMic);
    const [speaking, setSpeaking] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    const [cams, setCams] = useState<Dev[]>([]);
    const [mics, setMics] = useState<Dev[]>([]);
    const [camId, setCamId] = useState<string>(camFromQuery || '');
    const [micId, setMicId] = useState<string>(micFromQuery || '');
    const [levels, setLevels] = useState<Record<string, number>>({}); // nếu sau này bạn có onRemoteAudioLevel
    const [dominantId, setDominantId] = useState<string | null>(null);
    const [shareCount, setShareCount] = useState(0);

    function isDesktopShare(t: any) {
        const type = t?.getType?.() ?? t?.type;             // 'video' | 'audio'
        const vtype = t?.getVideoType?.() ?? t?.videoType;   // 'desktop' | 'screen' | 'camera' | undefined
        const kind = t?.stream?.getVideoTracks?.()?.[0]?.kind;
        const ds = t?.stream?.getVideoTracks?.()?.[0]?.getSettings?.()?.displaySurface; // monitor/window/browser

        return (
            type === 'video' &&
            (
                vtype === 'desktop' || vtype === 'screen' ||
                ds === 'monitor' || ds === 'window' || ds === 'application' ||
                // fallback: nếu là local screen track thường có label khác camera
                (kind === 'video' && String(t?.stream?.id || '').includes('screen'))
            )
        );
    }


    // Local audio level đã có: ghi vào map cho đồng bộ (id = 'local')
    useEffect(() => {
        setLevels(prev => ({ ...prev, local: audioLevel || 0 }));
    }, [audioLevel]);
    useEffect(() => {
        if (hasShare) {
            // move từ grid -> strip và thu size
            moveAll(gridHostRef.current!, stripHostRef.current!, 120);
        } else {
            // move từ strip -> grid và phóng size
            moveAll(stripHostRef.current!, gridHostRef.current!, 160);
        }
    }, [hasShare]);

    // Tô viền + scale cho tất cả bubble có data-pid
    useEffect(() => {
        const nodes = document.querySelectorAll<HTMLElement>('[data-pid], #local-bubble');
        nodes.forEach((node) => {
            const pid = node.id === 'local-bubble' ? 'local' : (node.dataset.pid || '');
            const lv = levels[pid] ?? (pid === 'local' ? (audioLevel || 0) : 0);
            const isDom = (dominantId && pid === dominantId) || lv > 8; // >8% coi như đang nói

            node.style.borderColor = isDom ? '#22c55e' : '#374151';
            const scale = 1 + Math.min(lv / 100, 0.08);
            node.style.transform = isDom ? `scale(${scale})` : 'scale(1)';
        });
    }, [levels, dominantId, audioLevel]);


    // custom circular attach/detach for remote tracks (video/audio)
    function attachRemoteCircle(track: any, container: HTMLElement, size: number) {
        const type = track.getType?.();
        if (type === 'audio') {
            const el = document.createElement('audio');
            el.autoplay = true; el.playsInline = true;
            try { track.attach(el); } catch { }
            container.appendChild(el);
            (track as any).__attachedEl = el;
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.position = 'relative';

        const bubble = document.createElement('div');
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.borderRadius = '50%';
        bubble.style.overflow = 'hidden';
        bubble.style.background = '#111827';
        bubble.style.border = '4px solid #374151';
        bubble.style.transition = 'transform 80ms ease, border-color 120ms ease';

        const el = document.createElement('video');
        el.autoplay = true; el.playsInline = true;
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.objectFit = 'cover';

        try { track.attach(el); } catch { }
        bubble.appendChild(el);
        wrapper.appendChild(bubble);
        container.appendChild(wrapper);

        // participant id (nhiều fallback cho chắc)
        const pid =
            track.getParticipantId?.() ||
            track.getParticipant?.()?.getId?.() ||
            track.getParticipant?.()?.getEndpointId?.() ||
            track.getSSRC?.()?.toString?.() ||
            Math.random().toString(36).slice(2);
        bubble.dataset.pid = String(pid);

        (track as any).__attachedEl = wrapper;
    }

    function detachRemoteCircle(track: any) {
        const el = (track as any).__attachedEl as HTMLElement | undefined;
        try {
            const media = el?.querySelector?.('video,audio') as HTMLMediaElement | null;
            if (media) track.detach?.(media);
        } catch { }
        try { el?.remove(); } catch { }
    }
    function resizeBubble(node: HTMLElement, size: number) {
        // node là div tròn (bubble)
        node.style.width = `${size}px`;
        node.style.height = `${size}px`;
    }

    function moveAll(from?: HTMLElement | null, to?: HTMLElement | null, size = 120) {
        if (!from || !to) return;
        // chỉ move các bubble (div có border tròn)
        const items = Array.from(from.querySelectorAll<HTMLElement>('div[data-pid]')).map(el => el.parentElement?.parentElement === from ? el : el); // đề phòng wrapper
        items.forEach(el => {
            try {
                resizeBubble(el, size);
                to.appendChild(el.parentElement as HTMLElement); // parent là wrapper chứa bubble
            } catch { }
        });
    }



    const {
        wireConferenceEvents,
        addLocalAV,
        disposeLocal,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        switchCamera,
        switchMicrophone,
    } = useConferenceTracks({
        attachRemote: (t: any) => {
            if (isDesktopShare(t)) {
                if (shareContainerRef.current) attachRemoteShare(t, shareContainerRef.current);
                setShareCount(c => { const n = c + 1; setHasShare(n > 0); return n; });
                return;
            }
            const host = hasShare ? stripHostRef.current : gridHostRef.current;
            if (!host) {
                setTimeout(() => {
                    const h2 = hasShare ? stripHostRef.current : gridHostRef.current;
                    if (h2) attachRemoteCircle(t, h2, hasShare ? 120 : 160);
                }, 0); return;
            }
            attachRemoteCircle(t, host, hasShare ? 120 : 160);
        },

        detachRemote: (t: any) => {
            if (isDesktopShare(t)) {
                try { detachRemoteShare(t); } catch { }
                setShareCount(c => { const n = Math.max(0, c - 1); setHasShare(n > 0); return n; });
                return;
            }
            detachRemoteCircle(t);
        },

        attachShare: (t: any) => {
            if (!isDesktopShare(t)) {
                // fallback về remote bình thường
                const host = hasShare ? stripHostRef.current : gridHostRef.current;
                if (!host) {
                    setTimeout(() => {
                        const h2 = hasShare ? stripHostRef.current : gridHostRef.current;
                        if (h2) attachRemoteCircle(t, h2, hasShare ? 120 : 160);
                    }, 0);
                    return;
                }
                attachRemoteCircle(t, host, hasShare ? 120 : 160);
                return;
            }
            if (shareContainerRef.current) attachRemoteShare(t, shareContainerRef.current);
            setShareCount(c => { const n = c + 1; setHasShare(n > 0); return n; });
        },

        detachShare: (t: any) => {
            try { detachRemoteShare(t); } catch { }
            setShareCount(c => { const n = Math.max(0, c - 1); setHasShare(n > 0); return n; });
        },

        attachLocal: (t: any) => {
            if (t.getType() === 'video') {
                t.attach(localVideoRef.current!);
                localVideoRef.current!.muted = true;
            }
        },

        onLocalAudioLevel: (lvl, spk) => { setAudioLevel(lvl); setSpeaking(spk); },
        setStatus,
    });


    // enumerate devices
    useEffect(() => {
        if (!ready) return;
        (async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                s.getTracks().forEach(t => t.stop());
            } catch { }

            let devices: MediaDeviceInfo[] = [];
            const JM = (window as any).JitsiMeetJS;
            try {
                devices = await JM?.mediaDevices?.enumerateDevices?.() ?? [];
            } catch { }
            if (!devices.length && navigator.mediaDevices?.enumerateDevices) {
                devices = await navigator.mediaDevices.enumerateDevices();
            }

            const c = devices.filter(d => d.kind === 'videoinput') as Dev[];
            const m = devices.filter(d => d.kind === 'audioinput') as Dev[];
            setCams(c);
            setMics(m);

            // load saved devices per chat room (global)
            if (!camFromQuery || !micFromQuery) {
                try {
                    const key = `meet::chat-${chatId || 'global'}::devices`;
                    const saved = JSON.parse(localStorage.getItem(key) || '{}');
                    if (!camFromQuery && saved.camId) camFromQuery = saved.camId;
                    if (!micFromQuery && saved.micId) micFromQuery = saved.micId;
                } catch { }
            }

            setCamId(camFromQuery || c[0]?.deviceId || '');
            setMicId(micFromQuery || m[0]?.deviceId || '');
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, chatId]);

    // join conference via /meet/token (chat spec: no room_id in request)
    const calledRef = useRef(false);
    useEffect(() => {
        if (!ready) return;
        if (calledRef.current) return;
        calledRef.current = true;

        (async () => {
            setStatus('fetching token…');

            const payload = { user_id: userId, subject_type: 'chat' as const, chat_id: chatId };
            if (!payload.chat_id) { setStatus('Missing chatId'); return; }
            const r2 = await getMeetingToken(payload);
            const joinRoom = r2.room_id;

            const conf = await connectAndJoin(joinRoom, r2.token, r2.websocket_url);
            const JM = (window as any).JitsiMeetJS;
            wireConferenceEvents(conf);
            try {
                conf.on(JM.events.conference.DOMINANT_SPEAKER_CHANGED, (id: string) => {
                    setDominantId(id || null);
                });
            } catch { }

            // 2) Mức âm lượng theo participant (0..1 hoặc 0..100 tuỳ build)
            try {
                conf.on(JM.events.conference.TRACK_AUDIO_LEVEL_CHANGED, (id: string, level: number) => {
                    const pct = level > 1 ? level : Math.round(level * 100);
                    setLevels(prev => ({ ...prev, [id]: pct }));
                });
            } catch { }

            // 3) Rời phòng: dọn map để không tô nhầm
            try {
                conf.on(JM.events.conference.USER_LEFT, (id: string) => {
                    setLevels(prev => { const { [id]: _, ...rest } = prev; return rest; });
                });
            } catch { }

            await addLocalAV(conf, { camId, micId, camOn: startCam, micOn: startMic });

            try {
                const key = `meet::${joinRoom}::devices`;
                localStorage.setItem(key, JSON.stringify({ camId, micId }));
            } catch { }

            setCamOn(!!startCam);
            setMicOn(!!startMic);
        })().catch(err => setStatus(String(err)));

        return () => { (async () => { await disposeLocal(conferenceRef.current); await leave(conferenceRef.current); })(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, userId, chatId]);

    // hot swap devices
    useEffect(() => {
        if (!conferenceRef.current || !camId) return;
        (async () => {
            try {
                await switchCamera?.(camId, conferenceRef.current);
            } catch { }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [camId]);

    useEffect(() => {
        if (!conferenceRef.current || !micId) return;
        (async () => {
            try {
                await switchMicrophone?.(micId, conferenceRef.current);
            } catch { }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [micId]);

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e5e7eb', display: 'flex', flexDirection: 'column' }}>
            {/* top bar */}
            <MeetingTopBar status={status} onLeave={async () => { await disposeLocal(conferenceRef.current); await leave(conferenceRef.current); router.push('/auth-join'); }} />

            {/* content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12, padding: 16, flex: 1, minHeight: 0 }}>
                {/* stage */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
                    <ShareStage
                        hasShare={hasShare}
                        shareRef={shareContainerRef}
                        gridRef={gridHostRef}
                        stripRef={stripHostRef}
                        localBubble={(
                            <div id="local-bubble" style={{ width: 160, height: 160, borderRadius: '50%', overflow: 'hidden', background: '#111827', border: '4px solid #374151', position: 'relative', transition: 'transform 80ms ease, border-color 120ms ease' }}>
                                <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                    />
                </div>

                {/* sidebar */}
                <PeopleSidebar devices={(
                    <>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Devices</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                            <select value={camId} onChange={async (e) => { const id = e.target.value; setCamId(id); try { await switchCamera?.(id, conferenceRef.current); } catch { } }}>
                                {cams.length === 0 ? <option value="">No camera</option> : cams.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}
                            </select>
                            <select value={micId} onChange={async (e) => { const id = e.target.value; setMicId(id); try { await switchMicrophone?.(id, conferenceRef.current); } catch { } }}>
                                {mics.length === 0 ? <option value="">No microphone</option> : mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>)}
                            </select>
                        </div>
                    </>
                )} />
            </div>

            {/* bottom control bar */}
            <BottomControlsBar
                micOn={micOn}
                camOn={camOn}
                onToggleMic={async () => setMicOn(await toggleAudio(conferenceRef.current))}
                onToggleCam={async () => setCamOn(await toggleVideo(conferenceRef.current))}
                onShare={async () => { await toggleScreenShare(conferenceRef.current); }}
                onLeave={async () => { await disposeLocal(conferenceRef.current); await leave(conferenceRef.current); router.push('/auth-join'); }}
            />
        </div>
    );
}


