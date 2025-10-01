'use client';
import React from 'react';
type LocalVideoProps = {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    className?: string;
};
export default function LocalVideo({ videoRef,className }:LocalVideoProps) {
    return (
        <div>
            <div style={{ marginBottom:6, fontWeight:600 }}>Local</div>
            <video ref={videoRef} playsInline style={{ width:320, height:240, background:'#111' }} />
        </div>
    );
}
