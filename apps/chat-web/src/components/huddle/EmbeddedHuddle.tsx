'use client';

import React, { useState, useEffect, useRef, useCallback, memo, forwardRef } from 'react';
import { X, Maximize2, GripHorizontal, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface EmbeddedHuddleProps {
  meetingUrl: string;
  onClose: () => void;
  onExpand?: () => void;
}

interface MeetingIframeProps {
  src: string;
  onLoad: () => void;
}

// Memoized iframe with forwardRef to prevent re-renders from causing iframe reload
const MeetingIframe = memo(forwardRef<HTMLIFrameElement, MeetingIframeProps>(
  function MeetingIframe({ src, onLoad }, ref) {
    return (
      <iframe
        ref={ref}
        src={src}
        className="w-full h-full border-0"
        allow="camera; microphone; display-capture; autoplay"
        onLoad={onLoad}
      />
    );
  }
));

export function EmbeddedHuddle({ meetingUrl, onClose }: EmbeddedHuddleProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Add embed parameter to URL - only compute once
  const [embedUrl] = useState(() => {
    const url = new URL(meetingUrl);
    url.searchParams.set('embed', 'true');
    return url.toString();
  });

  // Memoize onLoad callback
  const handleIframeLoad = useCallback(() => {
    setIsConnecting(false);
  }, []);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const meetOrigin = new URL(meetingUrl).origin;
      if (event.origin !== meetOrigin) return;

      const { type, payload } = event.data || {};

      switch (type) {
        case 'huddle:ready':
        case 'huddle:connected':
          setIsConnecting(false);
          break;
        case 'huddle:audioMuted':
          setIsAudioMuted(payload?.muted ?? false);
          break;
        case 'huddle:videoMuted':
          setIsVideoMuted(payload?.muted ?? false);
          break;
        case 'huddle:leave':
          onClose();
          break;
        case 'huddle:expand':
          handleExpand();
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [meetingUrl, onClose]);

  // Dragging logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      const maxX = window.innerWidth - 340;
      const maxY = window.innerHeight - 200;

      setPosition({
        x: Math.max(-maxX, Math.min(0, newX)),
        y: Math.max(-maxY, Math.min(0, newY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleExpand = () => {
    const fullUrl = new URL(meetingUrl);
    fullUrl.searchParams.delete('embed');
    window.open(fullUrl.toString(), '_blank');
    onClose();
  };

  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = () => {
    if (isLeaving) return; // Prevent double-click
    setIsLeaving(true);
    console.log('[EmbeddedHuddle] handleLeave called, sending leave command to iframe');
    sendCommand('leave');
    // The iframe will send 'huddle:leave' back after completing API call
    // This fallback timeout ensures we close even if iframe doesn't respond
    setTimeout(() => {
      console.log('[EmbeddedHuddle] Safety timeout reached, forcing close');
      onClose();
    }, 5000); // 5 second safety timeout
  };

  const sendCommand = (action: string) => {
    if (iframeRef.current?.contentWindow) {
      const meetOrigin = new URL(meetingUrl).origin;
      iframeRef.current.contentWindow.postMessage({ type: 'huddle:command', payload: { action } }, meetOrigin);
    }
  };

  const toggleAudio = () => {
    sendCommand('toggleAudio');
    // State will be updated via huddle:audioMuted message from iframe
  };

  const toggleVideo = () => {
    sendCommand('toggleVideo');
    // State will be updated via huddle:videoMuted message from iframe
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-50 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        width: '400px',
        height: '320px',
        backgroundColor: '#1a1a2e',
        border: '1px solid #2d2d44',
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Header - Draggable */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-white/60" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white/90 font-medium text-sm">Huddle</span>
        </div>
        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={handleExpand}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Mở rộng"
          >
            <Maximize2 className="w-4 h-4 text-white/80" />
          </button>
          <button
            onClick={handleLeave}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Rời khỏi"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>
        </div>
      </div>

      {/* Video iframe */}
      <div className="w-full h-full">
        {isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] z-5">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-emerald-500 mx-auto mb-2" />
              <span className="text-white/60 text-sm">Đang kết nối...</span>
            </div>
          </div>
        )}
        {isLeaving && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]/90 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-red-500 mx-auto mb-2" />
              <span className="text-white/60 text-sm">Đang rời khỏi...</span>
            </div>
          </div>
        )}
        <MeetingIframe ref={iframeRef} src={embedUrl} onLoad={handleIframeLoad} />
      </div>

      {/* Control buttons - floating at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 px-4 py-3 z-10"
        style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
      >
        <button
          onClick={toggleAudio}
          className={`p-2.5 rounded-full transition-colors backdrop-blur-sm ${
            isAudioMuted
              ? 'bg-red-500/80 text-white hover:bg-red-500'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          title={isAudioMuted ? 'Bật mic' : 'Tắt mic'}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-2.5 rounded-full transition-colors backdrop-blur-sm ${
            isVideoMuted
              ? 'bg-red-500/80 text-white hover:bg-red-500'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          title={isVideoMuted ? 'Bật camera' : 'Tắt camera'}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={handleLeave}
          className="p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          title="Rời khỏi"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
