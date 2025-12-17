'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has meeting info stored, redirect to meeting
    // Otherwise show 404 (meet-web is accessed from chat-web via huddle)
    const token = localStorage.getItem('jwtToken');
    const wsUrl = localStorage.getItem('websocketUrl');
    const roomId = localStorage.getItem('roomId');

    if (token && wsUrl && roomId) {
      router.push(`/meet/${roomId}`);
    } else {
      router.push('/not-found');
    }
  }, [router]);

  return null;
}
