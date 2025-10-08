'use client';
import React from 'react';

type LocalVideoProps = {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    className?: string;
};

export default function LocalVideo({ videoRef, className }: LocalVideoProps) {
    return (
        <div className={className}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: 320, height: 240, background: '#111', borderRadius: 8 }}
            />
        </div>
    );
}
