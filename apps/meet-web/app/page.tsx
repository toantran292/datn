'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has userId stored, redirect to meetings list
    // Otherwise redirect to join page
    const userId = localStorage.getItem('userId');
    if (userId) {
      router.push('/');
    } else {
      router.push('/join');
    }
  }, [router]);

  return null;
}
