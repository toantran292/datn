// RemoteGrid.tsx
'use client';
import React from 'react';

function makeVideoEl(mode: 'grid' | 'speaker') {
    const el = document.createElement('video');
    el.autoplay = true;
    el.playsInline = true;
    // ❌ KHÔNG mute remote video
    el.style.width = mode === 'grid' ? '320px' : '100%';
    el.style.height = mode === 'grid' ? '240px' : '100%';
    el.style.background = '#111';
    el.style.borderRadius = '8px';
    return el;
}

function safePlay(el: HTMLMediaElement) {
    // gọi play ngay, nếu bị block thì retry sau 1 tick
    const p = el.play();
    if (p?.catch) p.catch(() => {
        requestAnimationFrame(() => {
            el.play().catch(() => {/* vẫn bị block => chờ unlock click */ });
        });
    });
}
function makeAudioEl() {
    const el = document.createElement('audio');
    el.autoplay = true;
    el.playsInline = true;
    // ❌ KHÔNG mute remote audio
    el.style.display = 'none'; // không cần ô hiển thị
    return el;
}

export function attachRemoteTrack(track: any, container: HTMLElement, mode: 'grid' | 'speaker' = 'grid') {
    const type = track.getType?.();

    if (type === 'audio') {
        const el = document.createElement('audio');
        el.autoplay = true;
        el.playsInline = true;
        track.attach(el);
        container.appendChild(el);
        (track as any).__attachedEl = el;
        safePlay(el);                   // 👈 bắt đầu phát
        return;
    }

    // video (camera/desktop)
    const el = document.createElement('video');
    el.autoplay = true;
    el.playsInline = true;
    el.style.width = mode === 'grid' ? '320px' : '100%';
    el.style.height = mode === 'grid' ? '240px' : '100%';
    el.style.background = '#111';
    el.style.borderRadius = '8px';

    track.attach(el);
    container.appendChild(el);
    (track as any).__attachedEl = el;
    safePlay(el);                     // 👈 bắt đầu phát
}


export function detachRemoteTrack(track: any) {
    const el = (track as any).__attachedEl as HTMLMediaElement | undefined;
    try { el && track.detach(el); } catch { }
    try { el && el.remove(); } catch { }
}
let unlocked = false;
function unlockAllMedia() {
    if (unlocked) return;
    unlocked = true;
    const els = Array.from(document.querySelectorAll('video, audio')) as HTMLMediaElement[];
    els.forEach(el => el.play?.().catch(() => { }));
    // bỏ listener sau khi unlock
    document.removeEventListener('click', unlockAllMedia);
    document.removeEventListener('keydown', unlockAllMedia);
}
if (typeof window !== 'undefined') {
    document.addEventListener('click', unlockAllMedia, { once: true });
    document.addEventListener('keydown', unlockAllMedia, { once: true });
}

// API cũ tương thích
export function attachRemoteVideo(track: any, container: HTMLElement, mode: 'grid' | 'speaker' = 'grid') {
    attachRemoteTrack(track, container, mode);
}
export function detachRemoteVideo(track: any) {
    detachRemoteTrack(track);
}

export function attachRemoteShare(track: any, container: HTMLElement) {
    attachRemoteTrack(track, container, 'speaker');
}
export const detachRemoteShare = detachRemoteTrack;

export default function RemoteGrid({
    containerRef,
    shareRef,
}: {
    containerRef: React.RefObject<HTMLDivElement>;
    shareRef?: React.RefObject<HTMLDivElement>;
}) {
    return (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Remote</div>
                <div ref={containerRef} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} />
            </div>
            {shareRef && (
                <div style={{ minWidth: 480, flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Shared screens</div>
                    <div ref={shareRef} style={{ display: 'grid', gap: 12 }} />
                </div>
            )}
        </div>
    );
}
