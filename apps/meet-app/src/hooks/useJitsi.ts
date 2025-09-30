'use client';
import { useEffect, useRef, useState } from 'react';
import 'webrtc-adapter';
import {ensureJitsiLibs} from "@/lib/jitsi-loader";

type Track = any;

type JoinParams = {
    roomId: string;
    jwt: string;
    displayName: string;
};

export function useJitsi({ roomId, jwt, displayName }: JoinParams) {
    const localVideoRef = useRef<HTMLVideoElement|null>(null);
    const [remoteVideos, setRemoteVideos] = useState<{id:string, ref:HTMLVideoElement}[]>([]);
    const connRef = useRef<any>(null);
    const confRef = useRef<any>(null);
    const localTracksRef = useRef<Track[]>([]);

    useEffect(() => {
        let disposed = false;

        (async () => {
            await ensureJitsiLibs();

            const { JitsiMeetJS } = window as any;

            // -- cấu hình kết nối
            JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

            const connection = new JitsiMeetJS.JitsiConnection(
                /* appId */ null,
                /* token */ jwt,
                {
                    // dùng websocket thay vì serviceUrl
                    websocket: process.env.NEXT_PUBLIC_XMPP_WS || 'ws://localhost:40680/xmpp-websocket',
                    hosts: {
                        domain: process.env.NEXT_PUBLIC_XMPP_DOMAIN || 'meet.local',
                        muc: process.env.NEXT_PUBLIC_XMPP_MUC || 'muc.meet.local',
                    },
                    p2p: { enabled: false },
                }
            );

            connRef.current = connection;

            // log/error đơn giản
            connection.addEventListener(
                JitsiMeetJS.events.connection.CONNECTION_FAILED,
                (e:any) => console.error('XMPP connect fail', e)
            );

            connection.addEventListener(
                JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
                onConnected
            );

            connection.connect(); // bắt đầu

            async function onConnected() {
                if (disposed) return;

                const conf = connection.initJitsiConference(roomId, {
                    openBridgeChannel: true, // datachannel
                    enableNoAudioDetection: true,
                    enableNoisyMicDetection: true,
                    p2p: { enabled: false },
                });
                confRef.current = conf;

                // remote track
                conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track:Track) => {
                    if (track.isLocal()) return;
                    const participantId = track.getParticipantId();

                    // tạo thẻ video cho mỗi stream remote
                    const el = document.createElement(track.getType() === 'video' ? 'video' : 'audio');
                    el.autoplay = true as any; (el as any).playsInline = true;
                    track.attach(el);

                    // gom theo participant để dễ clean
                    setRemoteVideos(prev => {
                        if (track.getType() !== 'video') return prev;
                        return [...prev, { id: `${participantId}-${track.getStreamId?.() || track.getId()}`, ref: el as any }];
                    });
                });

                conf.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track:Track) => {
                    const el = track.getOriginalStream?.() ? track.containers?.[0] : null;
                    try { el && track.detach(el); } catch {}
                });

                conf.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, () => {
                    conf.setDisplayName(displayName);
                });

                conf.join(); // join room

                // tạo local tracks (cam + mic)
                const tracks:Track[] = await JitsiMeetJS.createLocalTracks({ devices: ['video','audio'] });
                localTracksRef.current = tracks;

                for (const t of tracks) {
                    await conf.addTrack(t);
                    if (t.getType() === 'video' && localVideoRef.current) {
                        t.attach(localVideoRef.current);
                    }
                }
            }

            return () => {};
        })();

        return () => {
            disposed = true;
            try {
                // cleanup
                localTracksRef.current.forEach(t => { try { t.dispose(); } catch {} });
                confRef.current?.leave?.();
                connRef.current?.disconnect?.();
            } catch {}
        };
    }, [roomId, jwt, displayName]);

    // vài helper
    const toggleVideo = () => {
        const v = localTracksRef.current.find(t => t.getType() === 'video');
        v && v.mute().catch(() => v.unmute());
    };
    const toggleAudio = () => {
        const a = localTracksRef.current.find(t => t.getType() === 'audio');
        a && a.mute().catch(() => a.unmute());
    };

    return { localVideoRef, remoteVideos, toggleVideo, toggleAudio };
}
