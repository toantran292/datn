'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WaitingState } from '@/components/WaitingState';

type Props = {
    params: { id: string };
};

export default function WaitingPage({ params }: Props) {
    const router = useRouter();
    const { id } = params;

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace(`/meet/${id}`);
        }, 1200);
        return () => clearTimeout(timer);
    }, [id, router]);

    return (
        <div className="w-full h-dvh" style={{ background: 'var(--ts-bg-dark)' }}>
            <WaitingState />
        </div>
    );
}


