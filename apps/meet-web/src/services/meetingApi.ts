// Fallback mặc định khi thiếu env
const API = process.env.NEXT_PUBLIC_MEET_API || 'http://localhost:40600'; // vd: http://localhost:40600

export async function createRoom(hostUserId: string) {
    const r = await fetch(`${API}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostUserId }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ room_id: string; ice_servers: any; policy: any }>;
}

/** ---- Spec đúng cho /meet/token ---- */
type ChatPayload = {
    user_id: string;
    subject_type: 'chat';
    chat_id: string;
};
type ProjectPayload = {
    user_id: string;
    subject_type: 'project';
    project_id: string;
    room_id?: string; // optional -> server tự tạo
};
type MeetTokenResp = { token: string; room_id: string; websocket_url: string };

export async function getMeetingToken(input: ChatPayload | ProjectPayload) {
    const r = await fetch(`${API}/meet/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!r.ok) {
        const errorText = await r.text();
        throw new Error(`Authentication failed: ${errorText}`);
    }
    return r.json() as Promise<MeetTokenResp>;
}

/** (tuỳ) wrapper tiện dùng */
export const getChatToken = (user_id: string, chat_id: string) =>
    getMeetingToken({ user_id, subject_type: 'chat', chat_id });

export const getProjectToken = (user_id: string, project_id: string, room_id?: string) =>
    getMeetingToken({ user_id, subject_type: 'project', project_id, room_id });
