'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

type Subject = 'chat' | 'project';

export default function AuthJoinPage() {
    const router = useRouter();

    const [subjectType, setSubjectType] = useState<Subject>('chat');
    const [userId, setUserId] = useState('user-1');

    // Chat
    const [chatId, setChatId] = useState('chat-1');

    // Project
    const [projectId, setProjectId] = useState('project-1');
    const [roomId, setRoomId] = useState(''); // optional for project

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Prefill
    useEffect(() => {
        try {
            const s = localStorage.getItem('subjectType') as Subject | null;
            const u = localStorage.getItem('userId');
            const c = localStorage.getItem('chatId');
            const p = localStorage.getItem('projectId');
            const r = localStorage.getItem('roomId');

            if (s) setSubjectType(s);
            if (u) setUserId(u);
            if (c) setChatId(c);
            if (p) setProjectId(p);
            if (r) setRoomId(r);
        } catch { }
    }, []);

    // Persist minimal
    const persist = () => {
        try {
            localStorage.setItem('subjectType', subjectType);
            localStorage.setItem('userId', userId);
            if (subjectType === 'chat') {
                localStorage.setItem('chatId', chatId);
            } else {
                localStorage.setItem('projectId', projectId);
                localStorage.setItem('roomId', roomId);
            }
        } catch { }
    };

    async function handleJoin() {
        setError('');
        if (!userId.trim()) return setError('Vui lòng nhập x-user-id');

        if (subjectType === 'chat') {
            if (!chatId.trim()) return setError('Vui lòng nhập chat channel id');
        } else {
            if (!projectId.trim()) return setError('Vui lòng nhập project id');
            // roomId có thể rỗng để server tự tạo
        }

        setIsLoading(true);
        persist();

        try {
            const payload =
                subjectType === 'chat'
                    ? {
                        user_id: userId.trim(),
                        subject_type: 'chat',
                        chat_id: chatId.trim(),
                    }
                    : {
                        user_id: userId.trim(),
                        subject_type: 'project',
                        project_id: projectId.trim(),
                        room_id: roomId.trim() || undefined,
                    };

            const data = await apiPost<{ room_id: string; token: string; websocket_url: string }>(
                '/meet/token',
                payload
            );
            const canonical = String(data.room_id);

            router.push(`waiting/${canonical}`);
        } catch (e: any) {
            setError(String(e.message || e));
        } finally {
            setIsLoading(false);
        }
    }

    // --- UI ---
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                background: '#2a2a3e', borderRadius: 16, padding: 40,
                width: '100%', maxWidth: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
                <div style={{
                    width: 40, height: 40, background: 'linear-gradient(135deg,#000,#fff)',
                    borderRadius: 8, margin: '0 auto 24px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700
                }}>M</div>

                <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, textAlign: 'center', margin: 0 }}>Welcome</h1>
                <p style={{ color: '#a0a0a0', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 28 }}>
                    Nhập thông tin để tiếp tục vào Meeting
                </p>

                {/* userId */}
                <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        x-user-id
                    </label>
                    <input
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="user-1"
                        style={{
                            width: '100%', padding: '12px 16px', background: '#1a1a2e',
                            border: '1px solid #4a4a5e', borderRadius: 8, color: '#fff'
                        }}
                    />
                </div>

                {/* subjectType */}
                <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        x-subject-type
                    </label>
                    <select
                        value={subjectType}
                        onChange={(e) => setSubjectType(e.target.value as Subject)}
                        style={{
                            width: '100%', padding: '12px 16px', background: '#1a1a2e',
                            border: '1px solid #4a4a5e', borderRadius: 8, color: '#fff'
                        }}
                    >
                        <option value="chat">Chat</option>
                        <option value="project">Project</option>
                    </select>
                </div>

                {/* conditional fields */}
                {subjectType === 'chat' ? (
                    <>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                                chat-channel-id
                            </label>
                            <input
                                value={chatId}
                                onChange={(e) => setChatId(e.target.value)}
                                placeholder="chat-1"
                                style={{
                                    width: '100%', padding: '12px 16px', background: '#1a1a2e',
                                    border: '1px solid #4a4a5e', borderRadius: 8, color: '#fff'
                                }}
                            />
                        </div>
                        {/* room-id hidden for chat; server sẽ trả 'chat-global' */}
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                                project-id
                            </label>
                            <input
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                placeholder="project-1"
                                style={{
                                    width: '100%', padding: '12px 16px', background: '#1a1a2e',
                                    border: '1px solid #4a4a5e', borderRadius: 8, color: '#fff'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                                room-id
                            </label>
                            <input
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="(room-1)"
                                style={{
                                    width: '100%', padding: '12px 16px', background: '#1a1a2e',
                                    border: '1px solid #4a4a5e', borderRadius: 8, color: '#fff'
                                }}
                            />
                        </div>
                    </>
                )}

                {error && (
                    <div style={{
                        background: '#dc2626', color: '#fff', padding: 12, borderRadius: 8,
                        fontSize: 14, marginBottom: 16, textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleJoin}
                    disabled={isLoading}
                    style={{
                        width: '100%', padding: 14,
                        background: isLoading ? '#6b7280' : 'linear-gradient(135deg,#8b5cf6,#a855f7)',
                        color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700,
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? 'Đang xác thực...' : 'Join room'}
                </button>
            </div>
        </div>
    );
}
