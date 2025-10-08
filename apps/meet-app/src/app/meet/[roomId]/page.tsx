'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useJitsiLoader } from '@/hooks/useJitsiLoader';
import { useMeetingConnection } from '@/hooks/useMeetingConnection';
import { useConferenceTracks } from '@/hooks/useConferenceTracks';
import { getMeetingToken } from '@/services/meetingApi';
import LocalVideo from '@/components/LocalVideo';
import RemoteGrid, { attachRemoteVideo, detachRemoteVideo, attachRemoteShare, detachRemoteShare } from '@/components/RemoteGrid';
import Controls from '@/components/Controls';

type Dev = MediaDeviceInfo & { deviceId: string; kind: string; label: string };

export default function MeetJoinPage() {
    const params = useParams<{ roomId?: string }>();
    const sp = useSearchParams();
    const router = useRouter();

    // ---- LẤY THAM SỐ ----
    const subject = (sp.get('subject') as 'chat' | 'project') || 'chat';
    const asGuest = sp.get('asGuest') === '1';
    const rawUserId = sp.get('userId') ?? 'user-1';
    const userId = asGuest ? `guest-${crypto.randomUUID()}` : rawUserId;

    const chatId = sp.get('chatId') ?? '';
    const projectId = sp.get('projectId') ?? '';
    const roomParam = (params.roomId || '').toLowerCase(); // chỉ dùng cho project

    // thiết bị từ query (nếu có)
    let camFromQuery = sp.get('cam') ?? undefined;
    let micFromQuery = sp.get('mic') ?? undefined;
    const startCam = sp.get('camOn') === '1';
    const startMic = sp.get('micOn') === '1';

    const { ready } = useJitsiLoader();
    const { status, setStatus, connectAndJoin, leave, conferenceRef } = useMeetingConnection();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteContainerRef = useRef<HTMLDivElement>(null);
    const shareContainerRef = useRef<HTMLDivElement>(null);

    const [camOn, setCamOn] = useState(!!startCam);
    const [micOn, setMicOn] = useState(!!startMic);
    const [speaking, setSpeaking] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    // danh sách device + value cho dropdown
    const [cams, setCams] = useState<Dev[]>([]);
    const [mics, setMics] = useState<Dev[]>([]);
    const [camId, setCamId] = useState<string>(camFromQuery || '');
    const [micId, setMicId] = useState<string>(micFromQuery || '');

    const {
        wireConferenceEvents,
        addLocalAV,
        disposeLocal,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        switchCamera,
        switchMicrophone
    } = useConferenceTracks({
        attachRemote: (t: any) => remoteContainerRef.current && attachRemoteVideo(t, remoteContainerRef.current, 'grid'),
        detachRemote: (t: any) => detachRemoteVideo(t, remoteContainerRef.current),
        attachShare: (t: any) => shareContainerRef.current && attachRemoteShare(t, shareContainerRef.current),
        detachShare: (t: any) => detachRemoteShare(t, shareContainerRef.current),
        attachLocal: (t: any) => {
            if (t.getType() === 'video') {
                t.attach(localVideoRef.current!);
                localVideoRef.current!.muted = true;
            }
        },
        onLocalAudioLevel: (lvl, spk) => { setAudioLevel(lvl); setSpeaking(spk); },
        setStatus,
    });

    // 1) enumerate devices
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

            // lấy default từ localStorage theo "room thực join" — chưa biết room => tạm theo roomParam cho project
            let storageKeySeed = subject === 'project' ? roomParam : `chat-${chatId || 'global'}`;
            if (!camFromQuery || !micFromQuery) {
                try {
                    const key = `meet::${storageKeySeed}::devices`;
                    const saved = JSON.parse(localStorage.getItem(key) || '{}');
                    if (!camFromQuery && saved.camId) camFromQuery = saved.camId;
                    if (!micFromQuery && saved.micId) micFromQuery = saved.micId;
                } catch { }
            }

            setCamId(camFromQuery || c[0]?.deviceId || '');
            setMicId(micFromQuery || m[0]?.deviceId || '');
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, subject, roomParam, chatId]);

    // 2) join conference (GỌI TOKEN ĐÚNG SPEC)
    const calledRef = useRef(false);
    useEffect(() => {
        if (!ready) return;
        if (calledRef.current) return;
        calledRef.current = true;

        (async () => {
            setStatus('fetching token…');

            const payload =
                subject === 'chat'
                    ? { user_id: userId, subject_type: 'chat', chat_id: chatId } // ✅ KHÔNG gửi room_id
                    : { user_id: userId, subject_type: 'project', project_id: projectId, room_id: roomParam || undefined };

            const r2 = await getMeetingToken(payload);
            const joinRoom = r2.room_id; // ✅ luôn dùng room_id backend trả

            const conf = await connectAndJoin(joinRoom, r2.token, r2.websocket_url);
            wireConferenceEvents(conf);

            await addLocalAV(conf, { camId, micId, camOn: startCam, micOn: startMic });

            // lưu device theo room thực tế
            try {
                const key = `meet::${joinRoom}::devices`;
                localStorage.setItem(key, JSON.stringify({ camId, micId }));
            } catch { }

            setCamOn(!!startCam);
            setMicOn(!!startMic);
        })().catch(err => setStatus(String(err)));

        return () => { (async () => { await disposeLocal(conferenceRef.current); await leave(conferenceRef.current); })(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, subject, userId, chatId, projectId, roomParam]);

    // 3) hot-swap devices
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
        <div style={{ padding: 16 }}>
            <h1>Subject: {subject}{subject === 'project' ? ` / RoomParam: ${roomParam || '(new)'}` : ''}</h1>
            <div>Status: {status}</div>

            {/* chọn device ngay trong phòng */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '8px 0 12px' }}>
                <select
                    value={camId}
                    onChange={async (e) => {
                        const id = e.target.value;
                        setCamId(id);
                        try {
                            await switchCamera?.(id, conferenceRef.current);
                        } catch { }
                    }}
                >
                    {cams.length === 0 ? <option value="">No camera</option> :
                        cams.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}
                </select>
                <select
                    value={micId}
                    onChange={async (e) => {
                        const id = e.target.value;
                        setMicId(id);
                        try {
                            await switchMicrophone?.(id, conferenceRef.current);
                        } catch { }
                    }}
                >
                    {mics.length === 0 ? <option value="">No microphone</option> :
                        mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>)}
                </select>
            </div>

            <Controls
                camOn={camOn}
                micOn={micOn}
                speaking={speaking}
                audioLevel={audioLevel}
                onToggleCam={async () => setCamOn(await toggleVideo(conferenceRef.current))}
                onToggleMic={async () => setMicOn(await toggleAudio(conferenceRef.current))}
                onShare={async () => { await toggleScreenShare(conferenceRef.current); }}
            />

            <button onClick={async () => { await disposeLocal(conferenceRef.current); await leave(conferenceRef.current); router.push('/auth-join'); }}>
                Leave
            </button>

            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <div>
                    <div style={{ marginBottom: 6, fontWeight: 600 }}>Local</div>
                    <LocalVideo videoRef={localVideoRef} />
                </div>
                <RemoteGrid containerRef={remoteContainerRef} shareRef={shareContainerRef} />
            </div>
        </div>
    );
}
