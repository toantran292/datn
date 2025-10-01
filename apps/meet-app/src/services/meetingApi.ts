const API = process.env.NEXT_PUBLIC_MEET_API!; // vd: http://localhost:40600

export async function createRoom(hostUserId: string) {
    const r = await fetch(`${API}/rooms`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ room_id: string; ice_servers: any; policy: any }>;
}

export async function getMeetingToken(input: {
    room_id: string;
    user: { id: string; name: string; email?: string };
    isModerator: boolean;
}) {
    const r = await fetch(`${API}/meet/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ token: string; websocket_url: string }>;
}
