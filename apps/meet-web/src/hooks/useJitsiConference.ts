import { useCallback, useEffect, useRef, useState } from 'react';
import { loadJitsiScript, getJitsi } from '@/lib/jitsi';

type AttachOpts = {
    attachLocal: (t: any) => void;
    attachRemote: (t: any) => void;
    detachRemote: (t: any) => void;
    attachShare?: (t: any) => void;
    detachShare?: (t: any) => void;
};

export function useJitsiConference(roomId: string, opts: AttachOpts) {
    const [status, setStatus] = useState<'idle' | 'ready' | 'connecting' | 'joined' | 'error'>('idle');
    const connectionRef = useRef<any>(null);
    const conferenceRef = useRef<any>(null);
    const localVideoRef = useRef<any | null>(null);
    const localAudioRef = useRef<any | null>(null);
    const localShareRef = useRef<any | null>(null);

    const connect = useCallback(async () => {
        await loadJitsiScript();
        const JM = getJitsi();
        if (!JM) throw new Error('Jitsi not loaded');

        JM.init({});

        const connection = new JM.JitsiConnection(null, undefined, {
            hosts: {
                domain: 'meet.jit.si',
                muc: 'conference.meet.jit.si',
            },
            serviceUrl: `wss://meet.jit.si/xmpp-websocket?room=${encodeURIComponent(roomId)}`,
        });

        connectionRef.current = connection;
        setStatus('connecting');

        await new Promise<void>((resolve, reject) => {
            connection.addEventListener(JM.events.connection.CONNECTION_ESTABLISHED, () => resolve());
            connection.addEventListener(JM.events.connection.CONNECTION_FAILED, () => reject(new Error('Jitsi connection failed')));
            connection.addEventListener(JM.events.connection.CONNECTION_DISCONNECTED, () => setStatus('idle'));
            connection.connect();
        });

        const conf = connection.initJitsiConference(roomId, { openBridgeChannel: true });
        conferenceRef.current = conf;

        conf.on(JM.events.conference.TRACK_ADDED, (t: any) => {
            if (t.isLocal()) return;
            if (t.getType() === 'video' && t.videoType === 'desktop') {
                opts.attachShare?.(t);
            } else {
                opts.attachRemote(t);
            }
        });

        conf.on(JM.events.conference.TRACK_REMOVED, (t: any) => {
            if (t.isLocal()) return;
            if (t.getType() === 'video' && t.videoType === 'desktop') {
                opts.detachShare?.(t);
            } else {
                opts.detachRemote(t);
            }
        });

        await new Promise<void>((resolve) => {
            conf.on(JM.events.conference.CONFERENCE_JOINED, () => {
                setStatus('joined');
                resolve();
            });
            conf.join();
        });

        return conf;
    }, [roomId, opts]);

    const addLocalTracks = useCallback(async (camOn: boolean, micOn: boolean) => {
        const JM = getJitsi();
        const conf = conferenceRef.current;
        if (!JM || !conf) return;

        const devices: Array<'video' | 'audio'> = [];
        if (camOn) devices.push('video');
        if (micOn) devices.push('audio');
        if (devices.length === 0) return;

        const tracks = await JM.createLocalTracks({ devices, resolution: 720 }).catch(() => []);
        for (const t of tracks as any[]) {
            if (t.getType() === 'video') { localVideoRef.current = t; opts.attachLocal(t); }
            if (t.getType() === 'audio') { localAudioRef.current = t; }
            await conf.addTrack(t);
        }
    }, [opts]);

    const leave = useCallback(async () => {
        try { await conferenceRef.current?.leave(); } catch { }
        try { connectionRef.current?.disconnect?.(); } catch { }
        conferenceRef.current = null;
        connectionRef.current = null;
        try { await localVideoRef.current?.dispose?.(); } catch { }
        try { await localAudioRef.current?.dispose?.(); } catch { }
        try { await localShareRef.current?.dispose?.(); } catch { }
        localVideoRef.current = null;
        localAudioRef.current = null;
        localShareRef.current = null;
        setStatus('idle');
    }, []);

    // toggles
    const toggleVideo = useCallback(async () => {
        const JM = getJitsi();
        const conf = conferenceRef.current;
        if (!JM || !conf) return false;
        let t = localVideoRef.current;
        if (!t) {
            const [nv] = await JM.createLocalTracks({ devices: ['video'], resolution: 720 }).catch(() => [null]);
            if (!nv) return false;
            localVideoRef.current = nv;
            try { opts.attachLocal(nv); } catch { }
            await conf.addTrack(nv);
            return true;
        }
        if (t.isMuted()) { await t.unmute(); return true; }
        await t.mute(); return false;
    }, [opts]);

    const toggleAudio = useCallback(async () => {
        const JM = getJitsi();
        const conf = conferenceRef.current;
        if (!JM || !conf) return false;
        let t = localAudioRef.current;
        if (!t) {
            const [na] = await JM.createLocalTracks({ devices: ['audio'] }).catch(() => [null]);
            if (!na) return false;
            localAudioRef.current = na;
            await conf.addTrack(na);
            return true;
        }
        if (t.isMuted()) { await t.unmute(); return true; }
        await t.mute(); return false;
    }, []);

    const toggleScreenShare = useCallback(async () => {
        const JM = getJitsi();
        const conf = conferenceRef.current;
        if (!JM || !conf) return false;
        if (localShareRef.current) {
            const t = localShareRef.current;
            try { await conf.removeTrack(t); } catch { }
            try { opts.detachShare?.(t); } catch { }
            try { t.dispose(); } catch { }
            localShareRef.current = null;
            return false;
        }
        const [s] = await JM.createLocalTracks({ devices: ['desktop'], desktopSharingFrameRate: { min: 5, max: 30 } }).catch(() => [null]);
        if (!s) return false;
        localShareRef.current = s;
        await conf.addTrack(s);
        try { opts.attachShare?.(s); } catch { }
        return true;
    }, [opts]);

    useEffect(() => {
        return () => { void leave(); };
    }, [leave]);

    return {
        status,
        connect,
        addLocalTracks,
        leave,
        conference: conferenceRef.current,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
    } as const;
}


