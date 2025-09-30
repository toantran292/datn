import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken, heartbeat } from '@/lib/api';

type Api = any;
function decodeExp(jwt: string) {
    try { return JSON.parse(atob(jwt.split('.')[1])).exp ?? 0; } catch { return 0; }
}

export function useMeeting(roomId: string, user: any, isModerator = false) {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const [api, setApi] = useState<Api | null>(null);
    const [jwt, setJwt] = useState('');
    const [loading, setLoading] = useState(true);

    const mount = useCallback((token: string) => {
        // @ts-ignore
        const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
        const domain = process.env.NEXT_PUBLIC_JITSI_HOST!;
        const websocket = process.env.NEXT_PUBLIC_MEET_WS!;
        const inst = new JitsiMeetExternalAPI(domain, {
            roomName: roomId,
            parentNode: wrapRef.current!,
            jwt: token,
            configOverwrite: { websocket, p2p: { enabled: false } },
        });
        setApi(inst); setLoading(false);
        return inst;
    }, [roomId]);

    useEffect(() => {
        let disposed = false;
        (async () => {
            const { token } = await getToken(roomId, user, isModerator);
            if (disposed) return;
            setJwt(token);
            const inst = mount(token);
            const hb = setInterval(() => heartbeat(roomId, user.id), 5000);
            inst.on('readyToClose', () => clearInterval(hb));
        })();
        return () => { disposed = true; api?.dispose?.(); };
    }, [roomId, user?.id, isModerator, mount]);

    useEffect(() => {
        if (!jwt || !api) return;
        const expMs = (decodeExp(jwt) || 0) * 1000;
        const renewAt = Math.max(Date.now() + 10_000, expMs - 60_000);
        const t = setTimeout(async () => {
            try {
                const { token } = await getToken(roomId, user, isModerator);
                setJwt(token);
                // nhiều bản Jitsi tự nhận token mới nếu gửi event:
                // @ts-ignore
                api._transport?.sendEvent?.({ data: { type: 'refreshToken', jwt: token } });
            } catch {}
        }, renewAt - Date.now());
        return () => clearTimeout(t);
    }, [jwt, api, roomId, user, isModerator]);

    return { wrapRef, api, loading };
}
