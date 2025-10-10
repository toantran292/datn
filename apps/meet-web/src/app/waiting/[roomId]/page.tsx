"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WaitingState } from "@/components/WaitingState";

export default function WaitingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [countdown, setCountdown] = useState(3);

    // Get user info from localStorage
    const [userInfo, setUserInfo] = useState({
        userId: '',
        subjectType: 'chat' as 'chat' | 'project',
        chatId: '',
        projectId: '',
        roomId: ''
    });

    useEffect(() => {
        try {
            const userId = localStorage.getItem('userId') || '';
            const subjectType = (localStorage.getItem('subjectType') as 'chat' | 'project') || 'chat';
            const chatId = localStorage.getItem('chatId') || '';
            const projectId = localStorage.getItem('projectId') || '';
            const roomId = localStorage.getItem('roomId') || '';

            console.log('Waiting page - userInfo from localStorage:', { userId, subjectType, chatId, projectId, roomId });
            setUserInfo({ userId, subjectType, chatId, projectId, roomId });
        } catch (error) {
            console.error('Error reading from localStorage:', error);
        }
    }, []);

    // Countdown and redirect
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Redirect to meeting room (user info is already in localStorage)
            const roomId = window.location.pathname.split('/').pop();
            console.log('Redirecting to meeting room:', `/meet/${roomId}`);
            router.push(`/meet/${roomId}`);
        }
    }, [countdown, userInfo, router]);

    return (
        <div className="h-dvh w-full relative overflow-hidden flex" style={{ background: "var(--ts-bg-dark)" }}>
            <WaitingState />
        </div>
    );
}
