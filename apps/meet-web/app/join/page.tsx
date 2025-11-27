'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMeetingToken } from '@/lib/api';

type Subject = 'chat' | 'project';

export default function JoinPage() {
    const router = useRouter();

    const [subjectType, setSubjectType] = useState<Subject>('chat');
    const [userId, setUserId] = useState('user-1');
    const [name, setName] = useState('User');

    // Chat
    const [chatId, setChatId] = useState('chat-1');

    // Project
    const [projectId, setProjectId] = useState('project-1');
    const [roomId, setRoomId] = useState(''); // optional for project

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Prefill from localStorage
    useEffect(() => {
        try {
            const s = localStorage.getItem('subjectType') as Subject | null;
            const u = localStorage.getItem('userId');
            const n = localStorage.getItem('name');
            const c = localStorage.getItem('chatId');
            const p = localStorage.getItem('projectId');
            const r = localStorage.getItem('roomId');

            if (s) setSubjectType(s);
            if (u) setUserId(u);
            if (n) setName(n);
            if (c) setChatId(c);
            if (p) setProjectId(p);
            if (r) setRoomId(r);
        } catch { }
    }, []);

    // Persist to localStorage
    const persist = () => {
        try {
            localStorage.setItem('subjectType', subjectType);
            localStorage.setItem('userId', userId);
            localStorage.setItem('name', name);
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
        if (!userId.trim()) return setError('Please enter user ID');

        if (subjectType === 'chat') {
            if (!chatId.trim()) return setError('Please enter chat channel ID');
        } else {
            if (!projectId.trim()) return setError('Please enter project ID');
        }

        setIsLoading(true);
        persist();

        try {
            const response = await getMeetingToken(
                subjectType === 'chat'
                    ? {
                        user_id: userId.trim(),
                        subject_type: 'chat',
                        chat_id: chatId.trim(),
                        user_name: name.trim(),
                    }
                    : {
                        user_id: userId.trim(),
                        subject_type: 'project',
                        project_id: projectId.trim(),
                        room_id: roomId.trim() || undefined,
                        user_name: name.trim(),
                    }
            );

            // Store meeting info
            localStorage.setItem('meetingId', response.meeting_id);
            localStorage.setItem('roomId', response.room_id);
            localStorage.setItem('jwtToken', response.token);
            localStorage.setItem('websocketUrl', response.websocket_url);
            localStorage.setItem('iceServers', JSON.stringify(response.ice_servers));

            // Navigate to meeting room
            router.push(`/meet/${response.room_id}`);
        } catch (e: any) {
            setError(String(e.message || e));
        } finally {
            setIsLoading(false);
        }
    }

    // UTS Brand Logo Component
    const UTSLogo = () => (
        <div className="w-16 h-16 bg-gradient-to-br from-ts-orange to-ts-teal rounded-2xl flex items-center justify-center shadow-xl">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 2v6h3l-6 6-6-6h3V2h6zm-6 14h6v6h-6v-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
        </div>
    );

    // --- UI ---
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-orange-50 to-teal-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white/90 backdrop-blur-sm p-8 shadow-2xl border border-white/20 rounded-3xl">
                    {/* Logo Section */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <UTSLogo />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Welcome to UTS Meet</h1>
                        <p className="text-gray-600 font-medium leading-relaxed">Enter your details to join a meeting</p>
                        <div className="w-20 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mt-4 opacity-60" />
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-5 mb-6 shadow-sm">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center py-12">
                            <div className="relative mb-6">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-ts-orange/20 border-t-ts-orange mx-auto" />
                                <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 bg-gradient-to-r from-ts-orange/10 to-ts-teal/10 mx-auto" />
                            </div>
                            <p className="text-gray-700 font-semibold text-lg">Connecting...</p>
                            <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
                        </div>
                    )}

                    {/* Join Form */}
                    {!isLoading && (
                        <div className="space-y-6">
                            {/* User ID */}
                            <div>
                                <label className="block text-gray-900 text-sm font-semibold mb-2">
                                    User ID
                                </label>
                                <input
                                    type="text"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="user-1"
                                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-ts-teal/25 focus:border-ts-teal transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-base text-gray-900"
                                    required
                                />
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-gray-900 text-sm font-semibold mb-2">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-ts-teal/25 focus:border-ts-teal transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-base text-gray-900"
                                />
                            </div>

                            {/* Subject Type */}
                            <div>
                                <label className="block text-gray-900 text-sm font-semibold mb-2">
                                    Meeting Type
                                </label>
                                <select
                                    value={subjectType}
                                    onChange={(e) => setSubjectType(e.target.value as Subject)}
                                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-ts-teal/25 focus:border-ts-teal transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-base text-gray-900"
                                >
                                    <option value="chat">Chat</option>
                                    <option value="project">Project</option>
                                </select>
                            </div>

                            {/* Conditional Fields */}
                            {subjectType === 'chat' ? (
                                <div>
                                    <label className="block text-gray-900 text-sm font-semibold mb-2">
                                        Chat Channel ID
                                    </label>
                                    <input
                                        type="text"
                                        value={chatId}
                                        onChange={(e) => setChatId(e.target.value)}
                                        placeholder="chat-1"
                                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-ts-teal/25 focus:border-ts-teal transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-base text-gray-900"
                                        required
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-gray-900 text-sm font-semibold mb-2">
                                            Project ID
                                        </label>
                                        <input
                                            type="text"
                                            value={projectId}
                                            onChange={(e) => setProjectId(e.target.value)}
                                            placeholder="project-1"
                                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-ts-teal/25 focus:border-ts-teal transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-base text-gray-900"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-900 text-sm font-semibold mb-2">
                                            Room ID <span className="text-gray-500 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={roomId}
                                            onChange={(e) => setRoomId(e.target.value)}
                                            placeholder="Leave blank to auto-generate"
                                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-ts-teal/25 focus:border-ts-teal transition-all duration-200 bg-white/80 backdrop-blur-sm font-medium text-base text-gray-900"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Join Button */}
                            <button
                                onClick={handleJoin}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-ts-orange to-ts-teal hover:shadow-xl text-white font-bold py-5 px-8 rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-ts-orange/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                            >
                                {isLoading ? 'Connecting...' : 'Join Meeting'}
                            </button>
                        </div>
                    )}

                    {/* Terms */}
                    {!isLoading && (
                        <div className="text-center pt-8 border-t border-gray-200 mt-8">
                            <p className="text-sm text-gray-500 leading-relaxed">
                                By continuing, you agree to our{" "}
                                <span className="text-ts-teal hover:text-ts-teal/80 font-semibold hover:underline cursor-pointer transition-colors">Terms of Service</span> and{" "}
                                <span className="text-ts-teal hover:text-ts-teal/80 font-semibold hover:underline cursor-pointer transition-colors">Privacy Policy</span>.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
