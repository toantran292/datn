'use client';
import React from 'react';
import type { ViewMode } from '@/lib/types';

type RemoteGridProps = {
    containerRef: React.RefObject<HTMLDivElement | null>;
    className?: string;
    children?: React.ReactNode;
};

export default function RemoteGrid({ containerRef,className,children }:RemoteGridProps) {
    return (
        <div>
            <div style={{ marginBottom:6, fontWeight:600 }}>Remote</div>
            <div ref={containerRef} style={{ display:'flex', flexWrap:'wrap', gap:8 }} />
        </div>
    );
}

// helper cho attach/detach
export function attachRemoteVideo(track:any, container: HTMLDivElement, viewMode: ViewMode, focus=false) {
    const el = document.createElement('video');
    el.autoplay = true; el.playsInline = true as any;
    el.setAttribute('data-track-id', track.getId());
    el.setAttribute('data-participant-id', track.getParticipantId?.() || '');
    el.className = 'rounded-xl shadow';
    el.style.width  = viewMode === 'grid' ? '256px' : (focus ? '560px' : '200px');
    el.style.height = viewMode === 'grid' ? '192px' : (focus ? '420px' : '150px');
    track.attach(el);
    container.appendChild(el);
}

export function detachRemoteVideo(track:any, container?: HTMLDivElement | null) {
    const id = track.getId();
    const el = container?.querySelector(`[data-track-id="${id}"]`) as HTMLElement | null;
    if (el) { try { track.detach(el); } catch {} el.remove(); }
}
