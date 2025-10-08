'use client';
import React from 'react';

export default function Controls({
    onToggleCam,
    onToggleMic,
    onShare,
    camOn,
    micOn,
    speaking,
    audioLevel,               // ⬅️ NEW
}: {
    onToggleCam: () => void;
    onToggleMic: () => void;
    onShare: () => void;
    camOn: boolean;
    micOn: boolean;
    speaking: boolean;
    audioLevel: number;       // 0..1
}) {
    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0', flexWrap: 'wrap' }}>
            <button onClick={onToggleMic}>{micOn ? 'Mute mic' : 'Unmute mic'}</button>
            <button onClick={onToggleCam}>{camOn ? 'Turn off cam' : 'Turn on cam'}</button>
            <button onClick={onShare}>Share screen</button>

            {/* VU meter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 220 }}>
                <div style={{ width: 140, height: 8, background: '#eee', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                        style={{
                            width: `${Math.min(100, Math.round(audioLevel * 100))}%`,
                            height: '100%',
                            transition: 'width 80ms linear',
                            background: micOn ? (speaking ? '#22c55e' : '#9ca3af') : '#d1d5db',
                        }}
                        aria-label="Mic level"
                    />
                </div>
                <span style={{ fontSize: 12, opacity: .75 }}>
                    Mic: {micOn ? (speaking ? 'speaking…' : 'on') : 'off'}
                </span>
            </div>
        </div>
    );
}
