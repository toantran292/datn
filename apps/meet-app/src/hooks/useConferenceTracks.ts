'use client';
import { useRef } from 'react';

export function useConferenceTracks(opts: {
    attachRemote: (track:any) => void;
    detachRemote: (track:any) => void;
    attachLocal: (track:any) => void;
    onDominant?: (pid: string) => void;
    setStatus?: (s: string) => void;
}) {
    const localTracksRef = useRef<any[]>([]);
    const remoteTracksRef = useRef<Record<string, any[]>>({});

    function wireConferenceEvents(conf: any) {
        const J = (window as any).JitsiMeetJS;
        conf.on(J.events.conference.TRACK_ADDED, (track:any) => {
            if (track.isLocal()) return;
            opts.attachRemote(track);
            const pid = track.getParticipantId();
            (remoteTracksRef.current[pid] ||= []).push(track);
        });
        conf.on(J.events.conference.TRACK_REMOVED, (track:any) => {
            opts.detachRemote(track);
        });
        if (opts.onDominant) {
            conf.on(J.events.conference.DOMINANT_SPEAKER_CHANGED, (id:string) => opts.onDominant!(id));
        }
    }

    async function addLocalAV(conf:any) {
        const J = (window as any).JitsiMeetJS;
        const tracks = await J.createLocalTracks({ devices: ['audio', 'video'] });
        localTracksRef.current = tracks;
        tracks.forEach((t:any) => { conf.addTrack(t); opts.attachLocal(t); });
    }

    async function toggleScreenShare(conf:any) {
        const J = (window as any).JitsiMeetJS;
        const sharing = localTracksRef.current.find((t:any) => t?.videoType === 'desktop');
        if (sharing) {
            await conf.removeTrack(sharing);
            sharing.dispose?.();
            localTracksRef.current = localTracksRef.current.filter((t:any) => t !== sharing);
            opts.setStatus?.('stopped screenshare');
            return;
        }
        const [desktop] = await J.createLocalTracks({ devices: ['desktop'] });
        localTracksRef.current.push(desktop);
        await conf.addTrack(desktop);
        opts.attachLocal(desktop);
        opts.setStatus?.('sharing screen');
    }

    async function disposeLocal(conf?:any) {
        try {
            const tracks = [...localTracksRef.current];
            await Promise.all(tracks.map(async (t:any) => {
                try { conf && (await conf.removeTrack(t)); } catch {}
                try { t.dispose?.(); } catch {}
            }));
            localTracksRef.current = [];
        } catch {}
    }

    return { wireConferenceEvents, addLocalAV, toggleScreenShare, disposeLocal, localTracksRef, remoteTracksRef };
}
