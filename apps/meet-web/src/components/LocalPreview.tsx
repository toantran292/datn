'use client'
import React, { useEffect, useRef } from 'react'

type LocalPreviewProps = {
    stream?: MediaStream | null
    className?: string
    muted?: boolean
}

export function LocalPreview({ stream, className, muted = true }: LocalPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const el = videoRef.current
        if (!el) return
        if (stream) {
            try {
                el.srcObject = stream
                void el.play()
            } catch { }
        } else {
            try { el.srcObject = null } catch { }
        }
    }, [stream])

    return (
        <div className={className}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="w-[220px] h-[156px] rounded-xl object-cover bg-black border border-[var(--ts-border)] shadow-lg"
            />
        </div>
    )
}


