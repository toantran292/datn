'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MeetBare from '@/components/MeetBare';
import { getToken } from '@/lib/api';

export default function JoinRoom() {
    const { roomId } = useParams() as { roomId: string };
    const [jwt, setJwt] = useState<string>();
    const [loading, setLoading] = useState(true);

    const user = { id: 'u2', name: 'Guest', email: 'guest@example.com', orgId: 'org1' };

    useEffect(() => {
        let disposed = false;
        (async () => {
            try {
                const { token } = await getToken(roomId, user, /* isModerator */ false);
                if (!disposed) setJwt(token);
            } finally {
                if (!disposed) setLoading(false);
            }
        })();
        return () => { disposed = true; };
    }, [roomId]);

    if (loading || !jwt) {
        return <div className="p-4">Đang vào phòng…</div>;
    }

    return (
        <div className="p-4">
            <MeetBare roomId={roomId} jwt={jwt} user={{ id: user.id, name: user.name }} />
        </div>
    );
}
