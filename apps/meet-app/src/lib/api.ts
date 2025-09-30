
export type IceServer = { urls: string[]; username?: string; credential?: string };

const BASE = process.env.NEXT_PUBLIC_MEET_API!;

export async function createRoom(hostUserId: string) {
    const r = await fetch(`${BASE}/rooms`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId }),
    });
    if (!r.ok) throw new Error('createRoom failed');
    return r.json() as Promise<{ room_id: string; ice_servers: IceServer[] }>;
}

export async function getToken(room_id: string, user: any, isModerator = false) {
    const r = await fetch(`${BASE}/meet/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id, user, isModerator }),
    });
    if (!r.ok) throw new Error('getToken failed');
    return r.json() as Promise<{ token: string; websocket_url: string }>;
}

export async function heartbeat(roomId: string, userId: string) {
    await fetch(`${BASE}/rooms/${roomId}/heartbeat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    }).catch(() => {});
}
