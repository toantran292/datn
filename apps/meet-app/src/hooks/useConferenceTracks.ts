import { useRef } from 'react';

type Opts = {
    attachRemote: (t: any) => void;
    detachRemote: (t: any) => void;
    attachShare?: (t: any) => void;   // NEW: remote desktop
    detachShare?: (t: any) => void;   // NEW
    attachLocal: (t: any) => void;    // gắn local camera vào <video>
    onLocalAudioLevel?: (lvl: number, speaking: boolean) => void; // NEW
    onDominant?: (id?: string) => void;
    setStatus: (s: string) => void;
};

export function useConferenceTracks(opts: Opts) {
    const localVideoRef = useRef<any | null>(null);
    const localAudioRef = useRef<any | null>(null);
    const localScreenRef = useRef<any | null>(null);

    // ✅ NEW: guard chỉ wire 1 lần / conference
    const wiredRef = useRef<WeakSet<any>>(new WeakSet());

    // ✅ NEW: dedupe track
    const remoteTrackIds = useRef<Set<string>>(new Set());
    const shareTrackIds = useRef<Set<string>>(new Set());

    // ✅ NEW: cách lấy id ổn định cho track
    const tid = (t: any) =>
        t?.getId?.() ??
        (t?.participant?.getId ? `${t.participant.getId()}-${t.getType?.()}` : `${t?.stream?.id || 'na'}-${t?.getType?.()}`);
    const vuCleanupRef = useRef<() => void>(() => { });
    function stopVU() {
        try { vuCleanupRef.current?.(); } catch { }
        vuCleanupRef.current = () => { };
        opts.onLocalAudioLevel?.(0, false);
    }

    // ===== helpers =====
    function _onLocalAudioLevel(track: any) {
        const JM = (window as any).JitsiMeetJS;
        track.on(JM.events.track.TRACK_AUDIO_LEVEL_CHANGED, (lvl: number) => {
            const speaking = lvl > 0.12;
            opts.onLocalAudioLevel?.(lvl, speaking);
        });
    }

    async function addLocalAV(conference: any, o?: { camId?: string; micId?: string; camOn?: boolean; micOn?: boolean }) {
        const JM = (window as any).JitsiMeetJS;

        // Nếu đã có track thì bỏ qua tạo lại
        const needAudio = !localAudioRef.current;
        const needVideo = !localVideoRef.current;
        const devices: Array<'audio' | 'video'> = [];
        if (needAudio) devices.push('audio');
        if (needVideo) devices.push('video');
        if (devices.length === 0) {
            // vẫn áp dụng mute theo flag nếu có
            if (o?.camOn === false) { try { await localVideoRef.current?.mute(); } catch { } }
            if (o?.micOn === false) { try { await localAudioRef.current?.mute(); stopVU(); } catch { } }
            opts.setStatus('joined room');
            return;
        }

        const tracks = await JM.createLocalTracks({
            devices,
            cameraDeviceId: o?.camId,
            micDeviceId: o?.micId,
            resolution: 720,
        }).catch((e: any) => { opts.setStatus(`device error: ${e?.name || e}`); return []; });

        for (const t of tracks) {
            if (t.getType() === 'video') {
                localVideoRef.current = t;
                opts.attachLocal(t);
                await conference.addTrack(t);
            } else if (t.getType() === 'audio') {
                localAudioRef.current = t;
                await conference.addTrack(t);
                wireMicVU(t);
            }
        }

        if (o?.camOn === false) { try { await localVideoRef.current?.mute(); } catch { } }
        if (o?.micOn === false) { try { await localAudioRef.current?.mute(); stopVU(); } catch { } }

        opts.setStatus('joined room');
    }



    async function disposeLocal(conference?: any) {
        for (const t of [localScreenRef.current, localVideoRef.current, localAudioRef.current]) {
            if (!t) continue;
            try { if (conference) await conference.removeTrack(t); } catch { }
            try { t.dispose(); } catch { }
        }
        localScreenRef.current = null;
        localVideoRef.current = null;
        localAudioRef.current = null;
    }

    // ==== toggles ====
    async function toggleVideo(conference: any) {
        const JM = (window as any).JitsiMeetJS;
        let t = localVideoRef.current;

        if (!t) {
            const [nv] = await JM.createLocalTracks({ devices: ['video'] }).catch(() => [null]);
            if (!nv) return false;
            localVideoRef.current = nv;
            opts.attachLocal(nv);
            await conference.addTrack(nv);
            return true; // vừa bật
        }

        if (t.isMuted()) { await t.unmute(); return true; }
        await t.mute(); return false;
    }

    async function toggleAudio(conference: any) {
        const JM = (window as any).JitsiMeetJS;
        let t = localAudioRef.current;

        if (!t) {
            const [na] = await JM.createLocalTracks({ devices: ['audio'] }).catch(() => [null]);
            if (!na) return false;
            localAudioRef.current = na;
            await conference.addTrack(na);
            wireMicVU(na);
            return true;
        }

        if (t.isMuted()) { await t.unmute(); wireMicVU(t); return true; }
        await t.mute(); stopVU(); return false;
    }



    async function toggleScreenShare(conference: any) {
        const JM = (window as any).JitsiMeetJS;

        if (localScreenRef.current) {
            const t = localScreenRef.current;
            // detach local preview trước khi remove/dispose
            opts.detachShare?.(t);
            try { await conference.removeTrack(t); } catch { }
            try { t.dispose(); } catch { }
            localScreenRef.current = null;
            return false;
        }

        const [s] = await JM.createLocalTracks({
            devices: ['desktop'],
            desktopSharingFrameRate: { min: 5, max: 30 },
        });

        localScreenRef.current = s;
        await conference.addTrack(s);

        // ⬇️ HIỂN THỊ local share ở vùng Shared screens
        opts.attachShare?.(s);

        return true;
    }
    function pickAudioMediaTrack(jt: any): MediaStreamTrack | null {
        try {
            const tr = jt?.getTrack?.();
            if (tr && tr.kind === 'audio') return tr as MediaStreamTrack;
            const fromStream = jt?.stream?.getAudioTracks?.()[0];
            if (fromStream) return fromStream as MediaStreamTrack;
        } catch { }
        return null;
    }


    function wireMicVU(jitsiAudioTrack: any) {
        stopVU();
        if (!jitsiAudioTrack || jitsiAudioTrack.getType?.() !== 'audio') return;

        let tries = 0;
        const maxTries = 8; // ~400ms
        const tryStart = () => {
            const mediaTrack = pickAudioMediaTrack(jitsiAudioTrack);
            if (!mediaTrack) {
                if (tries++ < maxTries) return void setTimeout(tryStart, 50);
                // bỏ cuộc, không có audio track
                return;
            }

            const stream = new MediaStream([mediaTrack]);

            const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioCtx();
            const src = ctx.createMediaStreamSource(stream); // <-- không còn lỗi ở đây
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            src.connect(analyser);

            const data = new Uint8Array(analyser.frequencyBinCount);
            let raf = 0;
            const loop = () => {
                analyser.getByteTimeDomainData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) {
                    const v = (data[i] - 128) / 128;
                    sum += v * v;
                }
                const rms = Math.sqrt(sum / data.length);    // ~0..0.5
                const lvl = Math.min(1, rms * 2);            // 0..1
                opts.onLocalAudioLevel?.(lvl, lvl > 0.12);
                raf = requestAnimationFrame(loop);
            };
            loop();

            vuCleanupRef.current = () => {
                cancelAnimationFrame(raf);
                try { src.disconnect(); } catch { }
                try { analyser.disconnect(); } catch { }
                try { ctx.close(); } catch { }
            };
        };

        tryStart();
    }

    function wireConferenceEvents(conference: any) {
        const JM = (window as any).JitsiMeetJS;

        if (wiredRef.current.has(conference)) return;
        wiredRef.current.add(conference);

        function wireMuteListener(t: any) {
            if (t.getType() !== 'video') return;
            t.addEventListener(JM.events.track.TRACK_MUTE_CHANGED, () => {
                if (t.isMuted()) {
                    opts.detachRemote(t);
                    remoteTrackIds.current.delete(tid(t));
                } else {
                    const id = tid(t);
                    if (!remoteTrackIds.current.has(id)) {
                        remoteTrackIds.current.add(id);
                        opts.attachRemote(t);
                    }
                }
            });
        }

        conference.on(JM.events.conference.TRACK_ADDED, (t: any) => {
            if (t.isLocal()) return;

            if (t.getType() === 'video' && t.videoType === 'desktop') {
                const id = tid(t);
                if (!shareTrackIds.current.has(id)) {
                    shareTrackIds.current.add(id);
                    opts.attachShare?.(t);
                }
                return;
            }

            const id = tid(t);
            if (!remoteTrackIds.current.has(id)) {
                remoteTrackIds.current.add(id);
                opts.attachRemote(t);
                wireMuteListener(t);
            }
        });

        conference.on(JM.events.conference.TRACK_REMOVED, (t: any) => {
            if (t.isLocal()) return;

            const id = tid(t);
            if (t.getType() === 'video' && t.videoType === 'desktop') {
                if (shareTrackIds.current.has(id)) {
                    shareTrackIds.current.delete(id);
                    opts.detachShare?.(t);
                }
                return;
            }

            if (remoteTrackIds.current.has(id)) {
                remoteTrackIds.current.delete(id);
                opts.detachRemote(t);
            }
        });

        if (opts.onDominant) {
            conference.on(JM.events.conference.DOMINANT_SPEAKER_CHANGED, (p: any) =>
                opts.onDominant?.(p?.id)
            );
        }
    }

    async function switchCamera(deviceId: string, conference?: any) {
        const JM = (window as any).JitsiMeetJS;
        const [newVideo] = await JM.createLocalTracks({
            devices: ['video'],
            cameraDeviceId: deviceId,
            resolution: 720,
        });

        const oldVideo = localVideoRef.current;

        // gắn preview local
        try { opts.attachLocal(newVideo); } catch { }

        if (conference) {
            if (oldVideo) await conference.replaceTrack(oldVideo, newVideo);
            else await conference.addTrack(newVideo);
        }

        try { oldVideo?.dispose(); } catch { }
        localVideoRef.current = newVideo;
    }

    async function switchMicrophone(deviceId: string, conference?: any) {
        const JM = (window as any).JitsiMeetJS;
        const [newAudio] = await JM.createLocalTracks({
            devices: ['audio'],
            micDeviceId: deviceId,
        });

        const oldAudio = localAudioRef.current;

        if (conference) {
            if (oldAudio) await conference.replaceTrack(oldAudio, newAudio);
            else await conference.addTrack(newAudio);
        }

        try { oldAudio?.dispose(); } catch { }
        localAudioRef.current = newAudio;

        // re-wire VU meter cho mic mới
        wireMicVU(newAudio);
    }


    return {
        wireConferenceEvents,
        addLocalAV,
        disposeLocal,
        toggleVideo,
        toggleAudio,
        toggleScreenShare, switchCamera, switchMicrophone

    };
}
