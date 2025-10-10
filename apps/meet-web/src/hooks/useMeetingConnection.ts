'use client';
import { useRef, useState } from 'react';

export function useMeetingConnection() {
    const connectionRef = useRef<any>(null);
    const conferenceRef = useRef<any>(null);
    const [status, setStatus] = useState('idle');

    async function connectAndJoin(room: string, jwt: string, wsUrl: string) {
        setStatus('connecting…');
        const J = (window as any).JitsiMeetJS;
        const wsWithToken = wsUrl + (wsUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(jwt);

        console.log('Connecting to Jitsi:', {
            room,
            wsUrl: wsWithToken,
            jwt: jwt.substring(0, 20) + '...'
        });

        const connection = new J.JitsiConnection(null, jwt, {
            hosts: { domain: 'meet.local', muc: 'muc.meet.local', focus: 'focus.meet.local' },
            serviceUrl: wsWithToken,
            p2p: { enabled: false },
        });
        connectionRef.current = connection;

        return await new Promise<any>((resolve, reject) => {
            connection.addEventListener(J.events.connection.CONNECTION_ESTABLISHED, () => {
                setStatus('connected → joining room…');
                const conf = connection.initJitsiConference(room, {
                    openBridgeChannel: 'websocket',
                    p2p: { enabled: false },
                    clientNode: 'meet-demo',
                    disableAudioLevels: false,
                });
                conferenceRef.current = conf;
                conf.on(J.events.conference.CONFERENCE_JOINED, () => {
                    setStatus('joined room');
                    console.log('Conference joined successfully');
                });
                conf.on(J.events.conference.CONFERENCE_FAILED, (e: any) => {
                    setStatus('conference failed');
                    console.error('Conference failed:', e);
                });
                conf.on(J.events.conference.USER_JOINED, (id: string, user: any) => {
                    console.log('User joined conference:', id, user);
                });
                conf.on(J.events.conference.USER_LEFT, (id: string) => {
                    console.log('User left conference:', id);
                });
                conf.join();
                resolve(conf);
            });
            connection.addEventListener(J.events.connection.CONNECTION_FAILED, (e: any) => { setStatus('connection failed'); reject(e); });
            connection.addEventListener(J.events.connection.CONNECTION_DISCONNECTED, () => setStatus('disconnected'));
            connection.connect();
        });
    }

    async function leave(conf?: any) {
        const c = conf || conferenceRef.current;
        try { await c?.leave(); } catch { }
        try { connectionRef.current?.disconnect?.(); } catch { }
        conferenceRef.current = null;
        connectionRef.current = null;
        setStatus('idle');
    }

    return { status, setStatus, connectAndJoin, leave, conferenceRef };
}
