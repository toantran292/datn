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
    onRemoteVideoMuteChanged?: (pid: string, muted: boolean) => void;
    onRemoteAudioLevel?: (pid: string, level: number, speaking: boolean) => void;
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
    const remoteVuCleanupsRef = useRef<Record<string, () => void>>({});
    function stopRemoteVU(pid: string) {
        try { remoteVuCleanupsRef.current[pid]?.(); } catch { }
        delete remoteVuCleanupsRef.current[pid];
        // tắt ring (phòng hờ) khi cleanup
        opts.onRemoteAudioLevel?.(pid, 0, false);
    }

    function wireRemoteVU(pid: string, jitsiAudioTrack: any) {
        stopRemoteVU(pid);
        const audioMediaTrack = pickAudioMediaTrack(jitsiAudioTrack);
        if (!audioMediaTrack) return; // không có track

        const stream = new MediaStream([audioMediaTrack]);
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(stream);
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
            const rms = Math.sqrt(sum / data.length); // ~0..0.5
            const lvl = Math.min(1, rms * 2);         // 0..1
            // nói khi lvl vượt ngưỡng
            opts.onRemoteAudioLevel?.(pid, lvl, lvl > 0.12);
            raf = requestAnimationFrame(loop);
        };
        loop();

        remoteVuCleanupsRef.current[pid] = () => {
            cancelAnimationFrame(raf);
            try { src.disconnect(); } catch { }
            try { analyser.disconnect(); } catch { }
            try { ctx.close(); } catch { }
        };
    }

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

    async function addLocalAV(
        conference: any,
        o?: { camId?: string; micId?: string; camOn?: boolean; micOn?: boolean }
    ) {
        const JM = (window as any).JitsiMeetJS;

        // Nếu đã có sẵn track: chỉ áp trạng thái mute/unmute rồi thoát
        const needAudio = !localAudioRef.current;
        const needVideo = !localVideoRef.current;
        const devices: Array<'audio' | 'video'> = [];
        if (needAudio) devices.push('audio');
        if (needVideo) devices.push('video');
        if (devices.length === 0) {
            if (o?.camOn === false) await localVideoRef.current?.mute().catch(() => { });
            if (o?.camOn === true) await localVideoRef.current?.unmute().catch(() => { });
            if (o?.micOn === false) { await localAudioRef.current?.mute().catch(() => { }); stopVU(); }
            if (o?.micOn === true) { await localAudioRef.current?.unmute().catch(() => { }); wireMicVU(localAudioRef.current); }
            opts.setStatus('joined room');
            return;
        }

        const tracks = await JM.createLocalTracks({
            devices,
            cameraDeviceId: o?.camId,
            micDeviceId: o?.micId,
            resolution: 720
        }).catch((e: any) => { opts.setStatus(`device error: ${e?.name || e}`); return []; });

        for (const t of tracks) {
            const type = t.getType();

            if (type === 'video') {
                localVideoRef.current = t;

                // ✅ MUTE TRƯỚC NẾU camOn=false
                if (o?.camOn === false) await t.mute().catch(() => { });

                // preview local không ảnh hưởng tới remote
                try { opts.attachLocal(t); } catch { }

                await conference.addTrack(t);

                if (o?.camOn !== false) {
                    // camOn true thì đảm bảo mở
                    if (t.isMuted()) await t.unmute().catch(() => { });
                }
            }

            if (type === 'audio') {
                localAudioRef.current = t;

                // ✅ MUTE TRƯỚC NẾU micOn=false (tránh “lọt tiếng”)
                if (o?.micOn === false) {
                    await t.mute().catch(() => { });
                    stopVU();
                }

                await conference.addTrack(t);

                if (o?.micOn !== false) {
                    if (t.isMuted()) await t.unmute().catch(() => { });
                    wireMicVU(t); // chỉ bật VU khi đang mở mic
                }
            }
        }

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

        console.log('Toggling video:', { hasTrack: !!t, isMuted: t?.isMuted() });

        if (!t) {
            const [nv] = await JM.createLocalTracks({ devices: ['video'] }).catch(() => [null]);
            if (!nv) return false;
            localVideoRef.current = nv;
            opts.attachLocal(nv);
            await conference.addTrack(nv);
            console.log('Created and added new video track');
            return true; // vừa bật
        }

        if (t.isMuted()) {
            await t.unmute();
            console.log('Video track unmuted');
            return true;
        }
        await t.mute();
        console.log('Video track muted');
        return false;
    }

    async function toggleAudio(conference: any) {
        const JM = (window as any).JitsiMeetJS;
        let t = localAudioRef.current;

        console.log('Toggling audio:', { hasTrack: !!t, isMuted: t?.isMuted() });

        if (!t) {
            const [na] = await JM.createLocalTracks({ devices: ['audio'] }).catch(() => [null]);
            if (!na) return false;
            localAudioRef.current = na;
            await conference.addTrack(na);
            wireMicVU(na);
            console.log('Created and added new audio track');
            return true;
        }

        if (t.isMuted()) {
            await t.unmute();
            wireMicVU(t);
            console.log('Audio track unmuted');
            return true;
        }
        await t.mute();
        stopVU();
        console.log('Audio track muted');
        return false;
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

        if (wiredRef.current.has(conference)) {
            console.log('Conference events already wired, skipping');
            return;
        }
        wiredRef.current.add(conference);
        console.log('Wiring conference events for:', conference);

        function wireMuteListener(t: any) {
            if (t.getType() !== 'video') return;
            const JM = (window as any).JitsiMeetJS;
            const pid = t.getParticipantId?.() || t.getParticipant?.()?.getId?.();
            t.addEventListener(JM.events.track.TRACK_MUTE_CHANGED, () => {
                opts.onRemoteVideoMuteChanged?.(pid, t.isMuted());
            });
        }

        console.log('Setting up TRACK_ADDED event listener');
        conference.on(JM.events.conference.TRACK_ADDED, (t: any) => {
            if (t.isLocal()) {
                return;
            }
            const type = t.getType?.();
            const pid =
                t.getParticipantId?.() ||
                t.getParticipant?.()?.getId?.() ||
                'unknown';

            if (type === 'audio') {
                let lastSpeak = 0;
                let speakingNow = false;
                let clearTimer: any = null;

                t.on(JM.events.track.TRACK_AUDIO_LEVEL_CHANGED, (lvl: number) => {
                    const speaking = lvl > 0.5

                    if (speaking) {
                        lastSpeak = Date.now();
                        if (!speakingNow) {
                            speakingNow = true;
                            opts.onRemoteAudioLevel?.(pid, lvl, true);
                        }
                        if (clearTimer) clearTimeout(clearTimer);
                        clearTimer = setTimeout(() => {
                            if (Date.now() - lastSpeak > 800) {
                                speakingNow = false;
                                opts.onRemoteAudioLevel?.(pid, 0, false);
                            }
                        }, 800);
                        wireRemoteVU(pid, t);
                    } else if (speakingNow) {
                        // nếu đang nói mà đột ngột im → chờ timeout để reset
                        if (clearTimer) clearTimeout(clearTimer);
                        clearTimer = setTimeout(() => {
                            if (Date.now() - lastSpeak > 800) {
                                speakingNow = false;
                                opts.onRemoteAudioLevel?.(pid, 0, false);
                            }
                        }, 800);
                    }
                });
                t.on(JM.events.track.TRACK_MUTE_CHANGED, () => {
                    // báo cho UI tắt ngay
                    opts.onRemoteAudioLevel?.(pid, 0, false);
                });
            }


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
                if (t.getType() === 'video') {
                    wireMuteListener(t);
                }
            }
        });

        conference.on(JM.events.conference.TRACK_REMOVED, (t: any) => {
            if (t.isLocal()) return;
            const pid = t.getParticipantId?.() || t.getParticipant?.()?.getId?.() || 'unknown';
            const id = tid(t);
            if (t.getType() === 'video' && t.videoType === 'desktop') {
                if (shareTrackIds.current.has(id)) {
                    shareTrackIds.current.delete(id);
                    opts.detachShare?.(t);
                }
                return;
            }
            if (t.getType?.() === 'audio') {
                // ✅ cleanup VU khi remote audio track bị remove
                stopRemoteVU(pid);
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

        // Add participant join/leave events
        conference.on(JM.events.conference.USER_JOINED, (id: string, user: any) => {
            console.log('User joined:', id, user);
        });

        conference.on(JM.events.conference.USER_LEFT, (id: string) => {
            console.log('User left:', id);
        });

        conference.on(JM.events.conference.PARTICIPANT_PROPERTY_CHANGED, (participant: any, property: string, oldValue: any, newValue: any) => {
            console.log('Participant property changed:', participant.getId(), property, oldValue, newValue);
        });
    }
    async function setVideoMuted(conference: any, muted: boolean) {
        const JM = (window as any).JitsiMeetJS;

        // ĐANG TẮT CAM
        if (muted) {
            const t = localVideoRef.current;
            if (!t) return null;
            try { await conference.removeTrack(t); } catch { }
            try { t.dispose(); } catch { }
            localVideoRef.current = null;
            return null;
        }

        // BẬT CAM
        if (!localVideoRef.current) {
            const [nv] = await JM.createLocalTracks({ devices: ['video'], resolution: 720 }).catch(() => [null]);
            if (!nv) return null;
            localVideoRef.current = nv;
            try { opts.attachLocal(nv); } catch { }
            await conference.addTrack(nv);
            return nv;
        }

        // Nếu đã có track (trường hợp hiếm), đảm bảo unmuted
        if (localVideoRef.current.isMuted()) {
            await localVideoRef.current.unmute().catch(() => { });
        }
        return localVideoRef.current;
    }

    async function setAudioMuted(conference: any, muted: boolean) {
        const JM = (window as any).JitsiMeetJS;

        let t = localAudioRef.current;
        if (!t) {
            // đảm bảo có track nếu người dùng bấm quá sớm
            const [na] = await JM.createLocalTracks({ devices: ['audio'] }).catch(() => [null]);
            if (!na) return; // hết permission / lỗi thiết bị
            localAudioRef.current = na;
            await conference.addTrack(na);
            t = na;
        }

        if (muted && !t.isMuted()) {
            await t.mute();
            stopVU();
        } else if (!muted && t.isMuted()) {
            await t.unmute();
            wireMicVU(t);
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
    function getLocalTracks() {
        return {
            videoTrack: localVideoRef.current,
            audioTrack: localAudioRef.current,
        };
    }

    return {
        wireConferenceEvents,
        addLocalAV,
        disposeLocal,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        setAudioMuted,
        setVideoMuted,
        switchCamera, switchMicrophone,
        getLocalTracks,
    };
}
