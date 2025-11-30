import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff } from 'lucide-react';
import type { JitsiTrack } from '@/types/jitsi';
import { getJitsiMeetJS } from '@/lib/jitsi';

interface ParticipantAvatarProps {
  name: string;
  tracks: JitsiTrack[];
  isLocal?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export function ParticipantAvatar({
  name,
  tracks,
  isLocal = false,
  isSpeaking = false,
  isMuted = false,
  size = 'medium',
  showTooltip = false,
}: ParticipantAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const attachedVideoTrackRef = useRef<JitsiTrack | null>(null);
  const attachedAudioTrackRef = useRef<JitsiTrack | null>(null);
  const muteChangeHandlerRef = useRef<(() => void) | null>(null);
  const videoEventHandlersRef = useRef<{
    loadedmetadata?: () => void;
    playing?: () => void;
    canplay?: () => void;
  }>({});

  useEffect(() => {
    const videoTrack = tracks.find(t => t.getType() === 'video');
    const audioTrack = tracks.find(t => t.getType() === 'audio');

    console.log('[ParticipantAvatar]', name, 'tracks:', tracks.length, 'video:', !!videoTrack, 'audio:', !!audioTrack, 'isLocal:', isLocal);

    // Handle video track
    if (videoRef.current) {
      // Detach previous track if different
      if (attachedVideoTrackRef.current && attachedVideoTrackRef.current !== videoTrack) {
        try {
          // Remove old mute listener
          if (muteChangeHandlerRef.current && attachedVideoTrackRef.current) {
            try {
              const JitsiMeetJS = getJitsiMeetJS();
              attachedVideoTrackRef.current.removeEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, muteChangeHandlerRef.current);
            } catch (e) {
              // Ignore
            }
          }
          attachedVideoTrackRef.current.detach(videoRef.current);
          console.log('[ParticipantAvatar]', name, 'detached old video track');
        } catch (err: any) {
          console.error('[ParticipantAvatar] Error detaching old video:', err);
        }
        attachedVideoTrackRef.current = null;
        muteChangeHandlerRef.current = null;
      }

      // Attach new video track
      if (videoTrack && attachedVideoTrackRef.current !== videoTrack) {
        const attachVideo = async () => {
          try {
            // Ensure video element is ready
            if (!videoRef.current) {
              console.warn('[ParticipantAvatar]', name, 'video element not ready');
              return;
            }

            // Attach track (returns Promise)
            await videoTrack.attach(videoRef.current);
            attachedVideoTrackRef.current = videoTrack;
            const isVideoMuted = videoTrack.isMuted();
            console.log('[ParticipantAvatar]', name, 'video track attached, muted:', isVideoMuted);

            // Wait a bit for stream to be attached to video element
            await new Promise(resolve => setTimeout(resolve, 200));

            // Check if stream is now available - retry if needed
            let retryCount = 0;
            const maxRetries = 5;
            const checkAndRetry = async () => {
              if (!videoRef.current) return;

              const hasStream = videoRef.current.srcObject !== null;
              const readyState = videoRef.current.readyState;
              console.log('[ParticipantAvatar]', name, `after attach (retry ${retryCount}) - srcObject:`, hasStream, 'readyState:', readyState);

              if (!hasStream && retryCount < maxRetries) {
                // Stream not attached yet, try re-attach
                retryCount++;
                console.log('[ParticipantAvatar]', name, `retrying attach (${retryCount}/${maxRetries})`);
                try {
                  await videoTrack.attach(videoRef.current);
                  await new Promise(resolve => setTimeout(resolve, 200));
                  checkAndRetry();
                } catch (err: any) {
                  console.error('[ParticipantAvatar]', name, 'retry attach failed:', err);
                }
                return;
              }

              // Set hasVideo based on whether track exists, is not muted, and has stream
              if (!isVideoMuted && hasStream) {
                setHasVideo(true);
                console.log('[ParticipantAvatar]', name, 'hasVideo set to true after attach');
              } else {
                setHasVideo(false);
                console.log('[ParticipantAvatar]', name, 'hasVideo set to false - muted:', isVideoMuted, 'hasStream:', hasStream);
              }

              // Try to play video
              if (videoRef.current && !isVideoMuted && hasStream) {
                try {
                  await videoRef.current.play();
                  console.log('[ParticipantAvatar]', name, 'video play started');
                } catch (playErr: any) {
                  console.warn('[ParticipantAvatar]', name, 'video play failed:', playErr);
                }
              }
            };

            await checkAndRetry();

            // Listen for mute changes
            const handleMuteChange = () => {
              if (videoTrack && videoRef.current) {
                const muted = videoTrack.isMuted();
                console.log('[ParticipantAvatar]', name, 'video mute changed:', muted);

                if (!muted) {
                  // When unmuted, check if stream is available
                  const hasStream = videoRef.current.srcObject !== null ||
                    videoRef.current.readyState >= 2;

                  if (hasStream) {
                    setHasVideo(true);
                    console.log('[ParticipantAvatar]', name, 'video unmuted and stream available');

                    // Try to play video
                    videoRef.current.play().catch((err: any) => {
                      console.warn('[ParticipantAvatar]', name, 'video play after unmute failed:', err);
                    });
                  } else {
                    // Stream not ready yet, wait for it
                    console.log('[ParticipantAvatar]', name, 'video unmuted but stream not ready yet');
                    setHasVideo(false);

                    // Wait for stream to be ready
                    const checkStream = () => {
                      if (videoRef.current && !videoTrack.isMuted()) {
                        const streamReady = videoRef.current.srcObject !== null ||
                          videoRef.current.readyState >= 2;
                        if (streamReady) {
                          setHasVideo(true);
                          console.log('[ParticipantAvatar]', name, 'video stream ready after unmute');
                          videoRef.current.play().catch(() => { });
                        } else {
                          setTimeout(checkStream, 100);
                        }
                      }
                    };
                    setTimeout(checkStream, 100);
                  }
                } else {
                  // Muted
                  setHasVideo(false);
                }
              }
            };

            muteChangeHandlerRef.current = handleMuteChange;

            try {
              const JitsiMeetJS = getJitsiMeetJS();
              videoTrack.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, handleMuteChange);
            } catch (err: any) {
              console.warn('[ParticipantAvatar] Could not add mute listener:', err);
            }

            // Try to play video and check for stream
            if (videoRef.current) {
              // Check if video has stream
              const checkVideoStream = () => {
                if (videoRef.current && videoTrack) {
                  const hasStream = videoRef.current.srcObject !== null ||
                    videoRef.current.readyState >= 2; // HAVE_CURRENT_DATA
                  const currentlyMuted = videoTrack.isMuted();
                  if (hasStream && !currentlyMuted) {
                    setHasVideo(true);
                    console.log('[ParticipantAvatar]', name, 'video stream detected, muted:', currentlyMuted);
                  } else if (!hasStream) {
                    console.log('[ParticipantAvatar]', name, 'video stream not ready yet, readyState:', videoRef.current.readyState);
                  }
                }
              };

              // Check immediately
              checkVideoStream();

              // Listen for video events
              const handleLoadedMetadata = () => {
                console.log('[ParticipantAvatar]', name, 'video loadedmetadata');
                checkVideoStream();
              };

              const handlePlaying = () => {
                console.log('[ParticipantAvatar]', name, 'video playing');
                // Check current mute state, not the old one
                if (videoTrack && !videoTrack.isMuted()) {
                  setHasVideo(true);
                  console.log('[ParticipantAvatar]', name, 'video playing and not muted, showing video');
                }
              };

              const handleCanPlay = () => {
                console.log('[ParticipantAvatar]', name, 'video canplay');
                checkVideoStream();
              };

              videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
              videoRef.current.addEventListener('playing', handlePlaying);
              videoRef.current.addEventListener('canplay', handleCanPlay);

              // Store handlers for cleanup
              videoEventHandlersRef.current = {
                loadedmetadata: handleLoadedMetadata,
                playing: handlePlaying,
                canplay: handleCanPlay
              };

              // Try to play after a short delay to ensure stream is attached
              setTimeout(() => {
                if (videoRef.current && !videoTrack.isMuted()) {
                  videoRef.current.play().catch((err: any) => {
                    console.warn('[ParticipantAvatar]', name, 'video play failed:', err);
                  });
                }
              }, 200);
            }
          } catch (err: any) {
            console.error('[ParticipantAvatar] Error attaching video:', err);
            setHasVideo(false);
          }
        };

        // Call async attach
        attachVideo();
      } else if (!videoTrack) {
        setHasVideo(false);
        attachedVideoTrackRef.current = null;
        muteChangeHandlerRef.current = null;
      } else if (videoTrack && attachedVideoTrackRef.current === videoTrack) {
        // Track already attached, check if video stream is available
        const isVideoMuted = videoTrack.isMuted();
        if (videoRef.current) {
          const hasStream = videoRef.current.srcObject !== null ||
            videoRef.current.readyState >= 2;

          // If stream is missing but track is attached, re-attach
          if (!hasStream && !isVideoMuted) {
            console.log('[ParticipantAvatar]', name, 'stream missing, re-attaching track');
            videoTrack.attach(videoRef.current).then(() => {
              if (videoRef.current) {
                setTimeout(() => {
                  if (videoRef.current && !videoTrack.isMuted()) {
                    const streamNow = videoRef.current.srcObject !== null;
                    if (streamNow) {
                      setHasVideo(true);
                      videoRef.current.play().catch(() => { });
                    }
                  }
                }, 100);
              }
            }).catch((err: any) => {
              console.error('[ParticipantAvatar]', name, 're-attach failed:', err);
            });
          }

          setHasVideo(!isVideoMuted && hasStream);

          // If not muted but no stream yet, try to play
          if (!isVideoMuted && !hasStream) {
            videoRef.current.play().catch((err: any) => {
              console.warn('[ParticipantAvatar]', name, 'video play failed:', err);
            });
          }
        } else {
          setHasVideo(!isVideoMuted);
        }
      }
    }

    // Handle audio track (only for remote participants)
    if (audioRef.current && !isLocal) {
      // Detach previous track if different
      if (attachedAudioTrackRef.current && attachedAudioTrackRef.current !== audioTrack) {
        try {
          attachedAudioTrackRef.current.detach(audioRef.current);
          console.log('[ParticipantAvatar]', name, 'detached old audio track');
        } catch (err: any) {
          console.error('[ParticipantAvatar] Error detaching old audio:', err);
        }
        attachedAudioTrackRef.current = null;
      }

      // Attach new audio track
      if (audioTrack && attachedAudioTrackRef.current !== audioTrack) {
        try {
          audioTrack.attach(audioRef.current);
          attachedAudioTrackRef.current = audioTrack;
          console.log('[ParticipantAvatar]', name, 'audio track attached');

          // Try to play audio
          if (audioRef.current) {
            audioRef.current.play().catch((err: any) => {
              console.warn('[ParticipantAvatar]', name, 'audio play failed:', err);
            });
          }
        } catch (err: any) {
          console.error('[ParticipantAvatar] Error attaching audio:', err);
        }
      }
    }

    return () => {
      // Remove video event listeners
      if (videoRef.current && videoEventHandlersRef.current) {
        const handlers = videoEventHandlersRef.current;
        if (handlers.loadedmetadata) {
          videoRef.current.removeEventListener('loadedmetadata', handlers.loadedmetadata);
        }
        if (handlers.playing) {
          videoRef.current.removeEventListener('playing', handlers.playing);
        }
        if (handlers.canplay) {
          videoRef.current.removeEventListener('canplay', handlers.canplay);
        }
        videoEventHandlersRef.current = {};
      }

      // Remove mute listener
      if (muteChangeHandlerRef.current && attachedVideoTrackRef.current) {
        try {
          const JitsiMeetJS = getJitsiMeetJS();
          attachedVideoTrackRef.current.removeEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, muteChangeHandlerRef.current);
        } catch (e) {
          // Ignore
        }
      }

      if (videoRef.current && attachedVideoTrackRef.current) {
        try {
          attachedVideoTrackRef.current.detach(videoRef.current);
        } catch (err: any) {
          console.error('[ParticipantAvatar] Error detaching video:', err);
        }
      }
      if (audioRef.current && attachedAudioTrackRef.current) {
        try {
          attachedAudioTrackRef.current.detach(audioRef.current);
        } catch (err: any) {
          console.error('[ParticipantAvatar] Error detaching audio:', err);
        }
      }
    };
  }, [tracks, isLocal, name]);

  // Additional effect to monitor video element state and re-attach if needed
  useEffect(() => {
    if (!videoRef.current || !attachedVideoTrackRef.current) return;

    const videoElement = videoRef.current;
    const videoTrack = attachedVideoTrackRef.current;

    // Periodic check for video stream (every 500ms for first 5 seconds)
    let checkCount = 0;
    const maxChecks = 10;
    const checkInterval = setInterval(() => {
      checkCount++;
      if (checkCount > maxChecks) {
        clearInterval(checkInterval);
        return;
      }

      const hasStream = videoElement.srcObject !== null ||
        videoElement.readyState >= 2;
      const isMuted = videoTrack.isMuted();

      // If stream is missing but track is not muted, re-attach
      if (!hasStream && !isMuted) {
        console.log('[ParticipantAvatar]', name, 'stream missing in periodic check, re-attaching');
        videoTrack.attach(videoElement).then(() => {
          setTimeout(() => {
            if (videoElement && !videoTrack.isMuted()) {
              const streamNow = videoElement.srcObject !== null;
              if (streamNow) {
                setHasVideo(true);
                videoElement.play().catch(() => { });
              }
            }
          }, 100);
        }).catch((err: any) => {
          console.error('[ParticipantAvatar]', name, 'periodic re-attach failed:', err);
        });
      } else if (hasStream && !isMuted && !hasVideo) {
        console.log('[ParticipantAvatar]', name, 'video stream detected in periodic check');
        setHasVideo(true);
        clearInterval(checkInterval);
      }
    }, 500);

    return () => {
      clearInterval(checkInterval);
    };
  }, [hasVideo, name]);

  const sizeClasses = {
    tiny: 'w-16 h-16',
    small: 'w-24 h-24',
    medium: 'w-48 h-48',
    large: 'w-64 h-64',
  };

  const ringSize = {
    tiny: 'w-20 h-20',
    small: 'w-28 h-28',
    medium: 'w-52 h-52',
    large: 'w-68 h-68',
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Debug: Log hasVideo state changes
  useEffect(() => {
    const videoTrack = tracks.find(t => t.getType() === 'video');
    if (videoTrack) {
      const isMuted = videoTrack.isMuted();
      console.log('[ParticipantAvatar]', name, 'hasVideo state:', hasVideo, 'track muted:', isMuted, 'hasTrack:', !!videoTrack);
      if (videoRef.current) {
        console.log('[ParticipantAvatar]', name, 'video element state:', {
          srcObject: !!videoRef.current.srcObject,
          readyState: videoRef.current.readyState,
          paused: videoRef.current.paused,
          muted: videoRef.current.muted
        });
      }
    }
  }, [hasVideo, tracks, name]);

  return (
    <div
      className="relative flex flex-col items-center gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speaking ring animation */}
      <div className="relative">
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute inset-0 -m-2 ${ringSize[size]} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 0px rgba(255, 136, 0, 0.4)',
                    '0 0 0 8px rgba(255, 136, 0, 0)',
                    '0 0 0 0px rgba(255, 136, 0, 0)',
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className={`${ringSize[size]} rounded-full border-[3px]`}
                style={{
                  borderColor: 'var(--ts-orange)',
                  boxShadow: '0 0 20px rgba(255, 136, 0, 0.3)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar/Video container */}
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.05, 1] } : isHovered ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`${sizeClasses[size]} rounded-full overflow-hidden relative border-2`}
          style={{
            backgroundColor: 'var(--ts-card-surface)',
            borderColor: isSpeaking ? 'var(--ts-orange)' : 'var(--ts-border)',
            boxShadow: isHovered ? '0 0 20px rgba(0, 196, 171, 0.4)' : undefined,
          }}
        >
          {/* Always render video element to allow track attachment */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
            style={{
              zIndex: hasVideo ? 10 : 0,
              opacity: hasVideo ? 1 : 0,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent'
            }}
            onLoadedMetadata={() => {
              if (videoRef.current && attachedVideoTrackRef.current) {
                const hasStream = videoRef.current.srcObject !== null ||
                  videoRef.current.readyState >= 2;
                const isMuted = attachedVideoTrackRef.current.isMuted();
                console.log('[ParticipantAvatar]', name, 'onLoadedMetadata - hasStream:', hasStream, 'isMuted:', isMuted, 'readyState:', videoRef.current.readyState);
                if (hasStream && !isMuted) {
                  console.log('[ParticipantAvatar]', name, 'onLoadedMetadata: showing video');
                  setHasVideo(true);
                }
              }
            }}
            onPlaying={() => {
              if (videoRef.current && attachedVideoTrackRef.current) {
                const isMuted = attachedVideoTrackRef.current.isMuted();
                console.log('[ParticipantAvatar]', name, 'onPlaying - isMuted:', isMuted);
                if (!isMuted) {
                  console.log('[ParticipantAvatar]', name, 'onPlaying: showing video');
                  setHasVideo(true);
                }
              }
            }}
            onCanPlay={() => {
              if (videoRef.current && attachedVideoTrackRef.current) {
                const hasStream = videoRef.current.srcObject !== null;
                const isMuted = attachedVideoTrackRef.current.isMuted();
                console.log('[ParticipantAvatar]', name, 'onCanPlay - hasStream:', hasStream, 'isMuted:', isMuted);
                if (hasStream && !isMuted) {
                  setHasVideo(true);
                }
              }
            }}
            onLoadedData={() => {
              if (videoRef.current && attachedVideoTrackRef.current) {
                const hasStream = videoRef.current.srcObject !== null;
                const isMuted = attachedVideoTrackRef.current.isMuted();
                console.log('[ParticipantAvatar]', name, 'onLoadedData - hasStream:', hasStream, 'isMuted:', isMuted);
                if (hasStream && !isMuted) {
                  setHasVideo(true);
                }
              }
            }}
          />

          {/* Audio element for remote participants */}
          {!isLocal && <audio ref={audioRef} autoPlay />}

          {/* Avatar fallback when no video or video is muted */}
          <div
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ts-orange/20 to-ts-teal/20 absolute inset-0 pointer-events-none"
            style={{
              zIndex: hasVideo ? 0 : 5,
              opacity: hasVideo ? 0 : 1,
              transition: 'opacity 0.3s ease'
            }}
          >
            <div className={`font-bold text-white ${size === 'tiny' ? 'text-sm' : size === 'small' ? 'text-lg' : size === 'medium' ? 'text-4xl' : 'text-5xl'}`}>
              {getInitials()}
            </div>
          </div>

          {/* Muted indicator */}
          {isMuted && size !== 'tiny' && (
            <div
              className="absolute bottom-1 right-1 rounded-full p-1.5 border"
              style={{
                backgroundColor: 'var(--ts-card-surface)',
                borderColor: 'var(--ts-border)',
              }}
            >
              <MicOff className="w-3 h-3" style={{ color: 'var(--ts-text-secondary)' }} />
            </div>
          )}
        </motion.div>

        {/* Tooltip on hover for compact mode */}
        <AnimatePresence>
          {showTooltip && isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap"
            >
              <div
                className="px-3 py-1.5 rounded-lg backdrop-blur-md border"
                style={{
                  background: 'rgba(0, 196, 171, 0.9)',
                  borderColor: 'var(--ts-teal)',
                  boxShadow: '0 4px 12px rgba(0, 196, 171, 0.4)',
                }}
              >
                <p className="text-sm text-white">{name}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name label - hide for tiny size or when tooltip is enabled */}
      {!showTooltip && size !== 'tiny' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 py-1.5 rounded-lg backdrop-blur-sm"
          style={{
            background: 'rgba(17, 24, 39, 0.8)',
          }}
        >
          <p className="text-sm text-white whitespace-nowrap">
            {isLocal ? `${name} (You)` : name}
          </p>
        </motion.div>
      )}

      {/* Speaking indicator label */}
      <AnimatePresence>
        {isSpeaking && size !== 'tiny' && !showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2"
          >
            <div
              className="px-2 py-1 rounded-full flex items-center gap-1"
              style={{ backgroundColor: 'var(--ts-orange)' }}
            >
              <Mic className="w-3 h-3 text-white" />
              <span className="text-xs text-white">Speaking</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
