'use client';
import { motion, AnimatePresence } from 'motion/react';
import { ParticipantAvatar } from './ParticipantAvatar';
import { Monitor, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { JitsiTrack } from '@/types/jitsi';

interface Participant {
    id: string;
    name: string;
    tracks: JitsiTrack[];
    isSpeaking?: boolean;
    isMuted?: boolean;
}

interface ScreenShareViewProps {
    participants: Participant[];
    localParticipant: {
        name: string;
        tracks: JitsiTrack[];
        isSpeaking?: boolean;
        isMuted?: boolean;
    };
    sharerName: string;
    screenShareTrack: JitsiTrack | null;
    screenSharingParticipantId: string | null;
    dominantSpeakerId: string | null;
    roomId: string;
}

export function ScreenShareView({
    participants,
    localParticipant,
    sharerName,
    screenShareTrack,
    screenSharingParticipantId,
    dominantSpeakerId,
    roomId,
}: ScreenShareViewProps) {
    const [scrollPosition, setScrollPosition] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const screenShareVideoRef = useRef<HTMLVideoElement>(null);

    // Normalize ID helper
    const normalizeId = (id: string | null) => {
        if (!id) return '';
        const parts = id.split('/');
        return parts.length > 1 ? parts[1] : parts[0];
    };

    // Combine local + remote participants
    // Filter tracks - when sharing screen, exclude camera tracks for sharer
    const isLocalSharing = screenSharingParticipantId === 'local' || (screenShareTrack && screenShareTrack.isLocal());

    const allParticipants = [
        {
            id: 'local',
            name: localParticipant.name,
            tracks: localParticipant.tracks.filter((t: any) => {
                // Always show camera for local participant, never show desktop track in participant strip
                const type = t.getType();
                if (type === 'video') {
                    const isDesktop = t.getVideoType?.() === 'desktop' || t.videoType === 'desktop';
                    return !isDesktop; // Always exclude desktop, only show camera
                }
                return true; // Keep audio
            }),
            isSpeaking: localParticipant.isSpeaking || false,
            isMuted: localParticipant.isMuted || false,
        },
        ...Array.from(participants).map(p => {
            const isSharer = p.id === screenSharingParticipantId;
            // Update isSpeaking based on dominantSpeakerId
            const normalizedPid = normalizeId(p.id);
            const normalizedDominant = normalizeId(dominantSpeakerId);
            const isSpeaking = normalizedPid === normalizedDominant && normalizedDominant !== '';

            return {
                id: p.id,
                name: p.name,
                tracks: p.tracks.filter((t: any) => {
                    const type = t.getType();
                    if (type === 'video') {
                        const isDesktop = t.getVideoType?.() === 'desktop' || t.videoType === 'desktop';
                        if (isSharer) {
                            // Sharer: only show desktop track, hide camera
                            return isDesktop;
                        }
                        // Others: only show camera, hide desktop
                        return !isDesktop;
                    }
                    return true; // Keep audio
                }),
                isSpeaking: isSpeaking,
                isMuted: p.isMuted || false,
            };
        })
    ];

    // Update local participant speaking state based on dominantSpeakerId
    const normalizedLocalId = normalizeId('local');
    const normalizedDominant = normalizeId(dominantSpeakerId);
    const localIsSpeakingFromDominant = normalizedLocalId === normalizedDominant && normalizedDominant !== '';

    // Update allParticipants with correct speaking states
    const updatedParticipants = allParticipants.map(p => {
        if (p.id === 'local') {
            return { ...p, isSpeaking: localParticipant.isSpeaking || localIsSpeakingFromDominant };
        }
        const normalizedPid = normalizeId(p.id);
        const isSpeaking = normalizedPid === normalizedDominant && normalizedDominant !== '';
        return { ...p, isSpeaking };
    });

    const activeSpeaker = updatedParticipants.find((p) => p.isSpeaking);
    const displayParticipants = updatedParticipants;

    const handleScroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;

        const scrollAmount = 300;
        const newPosition = direction === 'left'
            ? scrollPosition - scrollAmount
            : scrollPosition + scrollAmount;

        scrollContainerRef.current.scrollTo({
            left: newPosition,
            behavior: 'smooth',
        });
        setScrollPosition(newPosition);
    };

    const showScrollButtons = displayParticipants.length > 6;

    // Attach screen share track to video element
    useEffect(() => {
        if (screenShareTrack && screenShareVideoRef.current) {
            screenShareTrack.attach(screenShareVideoRef.current).catch((err) => {
                console.error('[ScreenShareView] Error attaching screen share track:', err);
            });

            return () => {
                if (screenShareVideoRef.current) {
                    screenShareTrack.detach(screenShareVideoRef.current);
                }
            };
        }
    }, [screenShareTrack]);

    return (
        <div className="w-full h-full flex flex-col relative">
            {/* Top overlay - Meeting info */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-6 left-6 z-20 flex items-center gap-4"
            >
                <div
                    className="px-4 py-2.5 rounded-xl backdrop-blur-md border"
                    style={{
                        background: 'rgba(17, 24, 39, 0.95)',
                        borderColor: 'var(--ts-border)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <h3 className="text-white">{roomId}</h3>
                    </div>
                </div>
            </motion.div>

            {/* Main screen share area - Centered and elevated */}
            <div className="flex-1 flex items-center justify-center px-8 pt-24 pb-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full max-w-7xl rounded-2xl overflow-hidden relative border-2"
                    style={{
                        borderColor: 'var(--ts-orange)',
                        boxShadow: '0 0 40px rgba(255, 136, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    {/* Screen share video */}
                    {screenShareTrack ? (
                        <video
                            ref={screenShareVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                            style={{
                                backgroundColor: '#000',
                            }}
                        />
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)',
                            }}
                        >
                            <div className="text-center">
                                <Monitor className="w-24 h-24 mx-auto mb-4" style={{ color: 'var(--ts-orange)' }} />
                                <h3 className="text-white mb-2">{sharerName} is sharing their screen</h3>
                                <p style={{ color: 'var(--ts-text-secondary)' }}>Screen content would appear here</p>
                            </div>
                        </div>
                    )}

                    {/* Gradient overlay for visual focus */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                'linear-gradient(to bottom, rgba(255,136,0,0.03) 0%, transparent 15%, transparent 85%, rgba(0,196,171,0.03) 100%)',
                        }}
                    />
                </motion.div>
            </div>

            {/* Participants Panel - Below screen */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="px-8 pb-32"
            >
                <div className="w-full max-w-7xl mx-auto relative">
                    {/* Scrollable container with navigation */}
                    <div className="relative">
                        {/* Left scroll button */}
                        {showScrollButtons && scrollPosition > 0 && (
                            <motion.button
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleScroll('left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 p-2 rounded-full backdrop-blur-md border"
                                style={{
                                    background: 'rgba(17, 24, 39, 0.95)',
                                    borderColor: 'var(--ts-border)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                }}
                            >
                                <ChevronLeft className="w-5 h-5" style={{ color: 'var(--ts-teal)' }} />
                            </motion.button>
                        )}

                        {/* Right scroll button */}
                        {showScrollButtons && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleScroll('right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 p-2 rounded-full backdrop-blur-md border"
                                style={{
                                    background: 'rgba(17, 24, 39, 0.95)',
                                    borderColor: 'var(--ts-border)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                }}
                            >
                                <ChevronRight className="w-5 h-5" style={{ color: 'var(--ts-teal)' }} />
                            </motion.button>
                        )}

                        {/* Participant strip */}
                        <div
                            className="rounded-2xl backdrop-blur-xl border-t-2 overflow-hidden"
                            style={{
                                background: 'rgba(17, 24, 39, 0.95)',
                                borderTopColor: 'var(--ts-border)',
                                boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <div
                                ref={scrollContainerRef}
                                className="flex items-center gap-6 px-6 py-4 overflow-x-auto scrollbar-hide"
                                style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                }}
                            >
                                {displayParticipants.map((participant, index) => (
                                    <motion.div
                                        key={participant.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex-shrink-0 group relative"
                                    >
                                        <ParticipantAvatar
                                            name={participant.name}
                                            tracks={participant.tracks}
                                            isLocal={participant.id === 'local'}
                                            isSpeaking={participant.isSpeaking || false}
                                            isMuted={participant.isMuted || false}
                                            size="small"
                                            showTooltip={true}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

