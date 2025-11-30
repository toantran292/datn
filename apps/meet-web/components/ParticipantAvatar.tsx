import { useEffect, useRef, useState, useCallback } from 'react';
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
    trackMute?: () => void;
    trackUnmute?: () => void;
  }>({});
  const isPlayingRef = useRef(false);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Helper function to safely play video
  const safePlayVideo = useCallback(async (videoElement: HTMLVideoElement) => {
    // If already playing or play in progress, skip
    if (!videoElement || (!videoElement.paused && !isPlayingRef.current)) {
      return;
    }

    // If play is already in progress, wait for it
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch {
        // Ignore errors from previous play
      }
      return;
    }

    try {
      // Wait a bit to ensure video element is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      if (videoElement && videoElement.paused && videoElement.srcObject) {
        // Check MediaStream before play
        const stream = videoElement.srcObject as MediaStream;
        const videoTracks = stream.getVideoTracks();

        isPlayingRef.current = true;
        playPromiseRef.current = videoElement.play();
        await playPromiseRef.current;
        playPromiseRef.current = null;
      } else {
        isPlayingRef.current = false;
      }
    } catch (err: any) {
      playPromiseRef.current = null;
      isPlayingRef.current = false;
      // Ignore AbortError - it's expected when video is interrupted
    }
  }, [name]);

  useEffect(() => {
    const videoTrack = tracks.find(t => t.getType() === 'video');
    const audioTrack = tracks.find(t => t.getType() === 'audio');

    // Track video track changes silently

    // Handle video track
    if (videoRef.current) {
      // Detach previous track if different
      if (attachedVideoTrackRef.current && attachedVideoTrackRef.current !== videoTrack) {
        try {
          // Cancel any pending play promise
          if (playPromiseRef.current) {
            playPromiseRef.current.catch(() => { }); // Ignore cancellation errors
            playPromiseRef.current = null;
          }
          isPlayingRef.current = false;

          // Remove old mute listener
          if (muteChangeHandlerRef.current && attachedVideoTrackRef.current) {
            try {
              const JitsiMeetJS = getJitsiMeetJS();
              attachedVideoTrackRef.current.removeEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, muteChangeHandlerRef.current);
            } catch (e) {
              // Ignore
            }
          }
          // Remove MediaStreamTrack event listeners before detach
          if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const videoTracks = stream.getVideoTracks();
            videoTracks.forEach(t => {
              if (videoEventHandlersRef.current.trackMute) {
                t.removeEventListener('mute', videoEventHandlersRef.current.trackMute);
              }
              if (videoEventHandlersRef.current.trackUnmute) {
                t.removeEventListener('unmute', videoEventHandlersRef.current.trackUnmute);
              }
            });
            videoEventHandlersRef.current.trackMute = undefined;
            videoEventHandlersRef.current.trackUnmute = undefined;
          }

          attachedVideoTrackRef.current.detach(videoRef.current);
        } catch (err: any) {
          // Ignore detach errors
        }
        attachedVideoTrackRef.current = null;
        muteChangeHandlerRef.current = null;
      }

      // Attach new video track
      if (videoTrack && attachedVideoTrackRef.current !== videoTrack) {
        const attachVideo = async () => {
          try {
            // Ensure video element is ready
            if (!videoRef.current) return;

            // Attach track (returns Promise)
            // CRITICAL: Ensure we're attaching to the correct video element for this participant
            if (!videoRef.current) return;

            await videoTrack.attach(videoRef.current);
            attachedVideoTrackRef.current = videoTrack;
            const isVideoMuted = videoTrack.isMuted();

            // Check MediaStreamTrack state immediately after attach
            if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              const videoTracks = stream.getVideoTracks();
              videoTracks.forEach(t => {
                // Listen for mute/unmute events on MediaStreamTrack
                const handleTrackMute = () => {
                  // Track muted event
                };

                const handleTrackUnmute = () => {
                  // Try to play when unmuted
                  if (videoRef.current && !videoTrack.isMuted()) {
                    setTimeout(() => {
                      safePlayVideo(videoRef.current!).catch(() => { });
                    }, 200);
                  }
                };

                t.addEventListener('mute', handleTrackMute);
                t.addEventListener('unmute', handleTrackUnmute);

                // Store handlers for cleanup
                if (!videoEventHandlersRef.current.trackMute) {
                  videoEventHandlersRef.current.trackMute = handleTrackMute;
                  videoEventHandlersRef.current.trackUnmute = handleTrackUnmute;
                }
              });
            }

            // Debug: Check MediaStream and tracks
            if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              const videoTracks = stream.getVideoTracks();
              const audioTracks = stream.getAudioTracks();

              // Also check track's stream if available
              let trackStreamInfo = null;
              try {
                // @ts-ignore - JitsiTrack might have getOriginalStream or getStream
                const originalStream = (videoTrack as any).getOriginalStream?.() || (videoTrack as any).getStream?.();
                if (originalStream) {
                  const origVideoTracks = originalStream.getVideoTracks();
                  trackStreamInfo = {
                    originalStreamId: originalStream.id,
                    originalVideoTracks: origVideoTracks.map((t: MediaStreamTrack) => ({
                      id: t.id,
                      enabled: t.enabled,
                      readyState: t.readyState,
                      muted: t.muted
                    }))
                  };
                }
              } catch (e) {
                // Ignore
              }

              // CRITICAL: Check MediaStreamTrack readyState
              // If readyState is "ended", track has no data
              const trackReadyStates = videoTracks.map(t => ({
                id: t.id,
                enabled: t.enabled,
                readyState: t.readyState, // "live" or "ended"
                muted: t.muted,
                kind: t.kind
              }));

              const hasLiveTrack = videoTracks.some(t => t.readyState === 'live');

              // If no live track, wait for it
              if (!hasLiveTrack && !isLocal) {

                // Listen for track to become live
                const checkTrackLive = () => {
                  if (videoRef.current && videoRef.current.srcObject) {
                    const currentStream = videoRef.current.srcObject as MediaStream;
                    const currentTracks = currentStream.getVideoTracks();
                    const nowHasLive = currentTracks.some(t => t.readyState === 'live');

                    if (nowHasLive) {
                      // Track became live, attempting play
                      if (videoRef.current && !videoRef.current.paused) {
                        safePlayVideo(videoRef.current).catch(() => { });
                      }
                    } else {
                      // Check again after delay
                      setTimeout(checkTrackLive, 500);
                    }
                  }
                };

                // Check after a delay
                setTimeout(checkTrackLive, 500);
              }
            }

            // Track attached successfully

            // Wait a bit for stream to be attached to video element
            // For remote tracks, wait longer to ensure WebRTC data is received
            const waitTime = isLocal ? 200 : 500;
            await new Promise(resolve => setTimeout(resolve, waitTime));

            // For remote tracks, check if video element can decode the stream
            if (!isLocal && videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              const videoTracks = stream.getVideoTracks();

              // Check video codec support and wait for actual video frames
              videoTracks.forEach(track => {
                const settings = track.getSettings();
                const hasVideoDimensions = settings.width && settings.height;

                // CRITICAL: If track is live but has no video dimensions, wait for frames
                if (!isLocal && track.readyState === 'live' && !hasVideoDimensions) {
                  // Check if track is muted (remote peer might have muted video)
                  const jitsiTrackMuted = videoTrack.isMuted();
                  const mediaTrackMuted = track.muted;

                  // CRITICAL: If MediaStreamTrack.muted = true, no frames will be sent
                  if (mediaTrackMuted) {
                    // Don't wait for dimensions if track is muted - it will never come
                    return;
                  }

                  // Check WebRTC receiver stats to see if packets are being received
                  const checkWebRTCStats = async () => {
                    try {
                      // Try to get RTCRtpReceiver from the stream's peer connection
                      // Note: MediaStream doesn't have getReceivers(), need to access via RTCPeerConnection
                      const pc = (stream as any)._pc || (stream as any).peerConnection;
                      if (pc && pc.getReceivers) {
                        const receivers = pc.getReceivers();
                        const receiver = receivers.find((r: RTCRtpReceiver) => {
                          return r.track && r.track.id === track.id;
                        });

                        if (receiver) {
                          const stats = await receiver.getStats();
                          stats.forEach((report: any) => {
                            if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                              // Check WebRTC stats silently
                            }
                          });
                        }
                      }
                    } catch (err: any) {
                      // Ignore stats errors
                    }
                  };

                  // Check stats after a delay
                  setTimeout(checkWebRTCStats, 1000);

                  // Poll for video dimensions
                  let dimensionCheckCount = 0;
                  const maxDimensionChecks = 20; // 10 seconds max
                  const checkForDimensions = () => {
                    if (videoRef.current && videoRef.current.srcObject) {
                      const currentStream = videoRef.current.srcObject as MediaStream;
                      const currentTracks = currentStream.getVideoTracks();
                      const currentTrack = currentTracks.find(t => t.id === track.id);

                      if (currentTrack) {
                        const currentSettings = currentTrack.getSettings();
                        const nowHasDimensions = currentSettings.width && currentSettings.height;

                        if (nowHasDimensions) {
                          // Video dimensions received - will try to play

                          // Now try to play
                          if (videoRef.current && videoRef.current.paused && !videoTrack.isMuted()) {
                            setTimeout(() => {
                              safePlayVideo(videoRef.current!).catch(() => { });
                            }, 200);
                          }
                        } else {
                          dimensionCheckCount++;
                          if (dimensionCheckCount < maxDimensionChecks) {
                            // Check again after delay
                            setTimeout(checkForDimensions, 500);
                          }
                        }
                      }
                    }
                  };

                  // Start checking after a delay
                  setTimeout(checkForDimensions, 500);
                }
              });

              // If track is live but video element readyState is still 0 after delay,
              // try to force video element to process stream
              setTimeout(() => {
                if (videoRef.current && videoRef.current.srcObject) {
                  const currentStream = videoRef.current.srcObject as MediaStream;
                  const currentTracks = currentStream.getVideoTracks();
                  const tracksLive = currentTracks.some(t => t.readyState === 'live');
                  const videoReady = videoRef.current.readyState >= 2; // HAVE_CURRENT_DATA

                  if (tracksLive && !videoReady) {

                    // Method: Try to trigger video load by setting currentTime
                    try {
                      if (videoRef.current.currentTime === 0) {
                        videoRef.current.currentTime = 0.1;
                      }
                    } catch (e) {
                      // Ignore
                    }

                    // Method: Try to play with longer delay
                    setTimeout(() => {
                      if (videoRef.current && !videoRef.current.paused === false) {
                        safePlayVideo(videoRef.current).catch(() => { });
                      }
                    }, 1000);
                  }
                }
              }, 1000);
            }

            // Check if stream is now available - retry if needed
            let retryCount = 0;
            const maxRetries = 5;
            const checkAndRetry = async () => {
              if (!videoRef.current) return;

              const hasStream = videoRef.current.srcObject !== null;
              const readyState = videoRef.current.readyState;
              const srcObjectType = videoRef.current.srcObject ? (videoRef.current.srcObject.constructor?.name || 'MediaStream') : 'null';

              // Debug: Check MediaStream tracks in detail
              let streamDebug = null;
              let trackReadyStateInfo = null;
              if (hasStream && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                const videoTracks = stream.getVideoTracks();
                streamDebug = {
                  streamId: stream.id,
                  active: stream.active,
                  videoTracks: videoTracks.map(t => ({
                    id: t.id,
                    enabled: t.enabled,
                    readyState: t.readyState, // "live" or "ended"
                    muted: t.muted,
                    kind: t.kind
                  }))
                };

                // CRITICAL: Check if tracks are "live"
                const allTracksLive = videoTracks.every(t => t.readyState === 'live');
                const anyTrackLive = videoTracks.some(t => t.readyState === 'live');
                trackReadyStateInfo = {
                  allTracksLive,
                  anyTrackLive,
                  tracksCount: videoTracks.length,
                  trackStates: videoTracks.map(t => t.readyState)
                };

                // If remote and tracks are not live, this is the problem!
                // Track state silently
              }

              // Check stream state

              // IMPORTANT: If we have srcObject, set hasVideo immediately (don't wait for readyState)
              // readyState can be 0 even when stream is attached
              if (hasStream && !isVideoMuted) {
                // srcObject exists, setting hasVideo
                setHasVideo(true);

                // For remote tracks with live MediaStreamTrack but videoElement.readyState = 0,
                // try to force video element to process the stream
                if (!isLocal && videoRef.current && videoRef.current.readyState === 0) {
                  const stream = videoRef.current.srcObject as MediaStream;
                  const videoTracks = stream.getVideoTracks();

                  // If tracks are live but video element is not ready, try to force reload
                  if (videoTracks.some(t => t.readyState === 'live')) {

                    // Method 1: Try to reload by setting srcObject again
                    try {
                      const currentStream = videoRef.current.srcObject;
                      videoRef.current.srcObject = null;
                      await new Promise(resolve => setTimeout(resolve, 50));
                      videoRef.current.srcObject = currentStream;
                      // Reset srcObject to force reload

                      // Wait longer for remote streams
                      await new Promise(resolve => setTimeout(resolve, 500));

                      // Try play again
                      if (videoRef.current && videoRef.current.srcObject) {
                        await safePlayVideo(videoRef.current);
                      }
                    } catch (err: any) {
                      // Ignore reset errors
                    }
                  }
                } else {
                  // Normal play for local or if readyState > 0
                  if (videoRef.current) {
                    await safePlayVideo(videoRef.current);
                  }
                }
                return; // Exit early if we have stream
              }

              if (!hasStream && retryCount < maxRetries) {
                // Stream not attached yet, try re-attach
                retryCount++;
                // Retrying attach
                try {
                  await videoTrack.attach(videoRef.current);
                  await new Promise(resolve => setTimeout(resolve, 200));
                  checkAndRetry();
                } catch (err: any) {
                  // Ignore retry errors
                }
                return;
              }

              // No stream after retries
              if (!hasStream) {
                setHasVideo(false);
              } else if (isVideoMuted) {
                setHasVideo(false);
              }
            };

            await checkAndRetry();

            // Listen for mute changes
            const handleMuteChange = () => {
              if (videoTrack && videoRef.current) {
                const muted = videoTrack.isMuted();
                // Video mute state changed

                if (!muted) {
                  // When unmuted, check if stream is available
                  const hasStream = videoRef.current.srcObject !== null ||
                    videoRef.current.readyState >= 2;

                  if (hasStream) {
                    setHasVideo(true);
                    // Video unmuted, stream available

                    // Try to play video safely
                    safePlayVideo(videoRef.current).catch(() => { });
                  } else {
                    // Stream not ready yet, wait for it
                    // Video unmuted but stream not ready
                    setHasVideo(false);

                    // Wait for stream to be ready
                    const checkStream = () => {
                      if (videoRef.current && !videoTrack.isMuted()) {
                        const streamReady = videoRef.current.srcObject !== null ||
                          videoRef.current.readyState >= 2;
                        if (streamReady) {
                          setHasVideo(true);
                          // Video stream ready after unmute
                          safePlayVideo(videoRef.current).catch(() => { });
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
              // Ignore listener errors
            }

            // Try to play video and check for stream
            if (videoRef.current) {
              // Check if video has stream
              const checkVideoStream = () => {
                if (videoRef.current && videoTrack) {
                  // Check srcObject first - this is the most reliable indicator
                  const hasStream = videoRef.current.srcObject !== null;
                  const readyState = videoRef.current.readyState;
                  const currentlyMuted = videoTrack.isMuted();
                  if (hasStream && !currentlyMuted) {
                    setHasVideo(true);
                  }
                }
              };

              // Check immediately
              checkVideoStream();

              // Listen for video events
              const handleLoadedMetadata = () => {
                checkVideoStream();
              };

              const handlePlaying = () => {
                // Check current mute state and stream
                if (videoTrack && videoRef.current && !videoTrack.isMuted()) {
                  const hasStream = videoRef.current.srcObject !== null;
                  if (hasStream) {
                    setHasVideo(true);
                  }
                }
              };

              const handleCanPlay = () => {
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
                  safePlayVideo(videoRef.current).catch(() => { });
                }
              }, 200);
            }
          } catch (err: any) {
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
            // Stream missing, re-attaching track
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
            }).catch(() => { });
          }

          setHasVideo(!isVideoMuted && hasStream);

          // If not muted but no stream yet, try to play
          if (!isVideoMuted && !hasStream) {
            videoRef.current.play().catch(() => { });
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
        } catch (err: any) {
          // Ignore detach errors
        }
        attachedAudioTrackRef.current = null;
      }

      // Attach new audio track
      if (audioTrack && attachedAudioTrackRef.current !== audioTrack) {
        try {
          audioTrack.attach(audioRef.current);
          attachedAudioTrackRef.current = audioTrack;

          // Try to play audio
          if (audioRef.current) {
            audioRef.current.play().catch(() => { });
          }
        } catch (err: any) {
          // Ignore attach errors
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
          // Ignore detach errors
        }
      }
      if (audioRef.current && attachedAudioTrackRef.current) {
        try {
          attachedAudioTrackRef.current.detach(audioRef.current);
        } catch (err: any) {
          // Ignore detach errors
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
        // Stream missing, re-attaching
        videoTrack.attach(videoElement).then(() => {
          setTimeout(() => {
            if (videoElement && !videoTrack.isMuted()) {
              const streamNow = videoElement.srcObject !== null;
              if (streamNow) {
                setHasVideo(true);
                safePlayVideo(videoElement).catch(() => { });
              }
            }
          }, 100);
        }).catch(() => { });
      } else if (hasStream && !isMuted && !hasVideo) {
        // Video stream detected
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
      if (videoRef.current) {
        const srcObject = videoRef.current.srcObject;
        const hasStream = srcObject !== null;
        // If we have srcObject but hasVideo is false and track is not muted, force update
        if (hasStream && !isMuted && !hasVideo) {
          // Force hasVideo=true
          setHasVideo(true);

          // Also try to play if paused
          if (videoRef.current && videoRef.current.paused) {
            const stream = videoRef.current.srcObject as MediaStream;
            const videoTracks = stream.getVideoTracks();
            // Force play
            safePlayVideo(videoRef.current).catch(() => { });
          }
        }

        // Check if video is stuck and try to fix
        if (hasStream && !isMuted && hasVideo && videoRef.current && videoRef.current.paused && videoRef.current.readyState === 0) {
          const stream = videoRef.current.srcObject as MediaStream;
          const videoTracks = stream.getVideoTracks();
          // Try to play if stuck
          if (videoTracks.length > 0) {
            safePlayVideo(videoRef.current).catch(() => { });
          }
        }
      }
    }
  }, [hasVideo, tracks, name]);

  return (
    <div
      className="relative flex flex-col items-center gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speaking ring animation - positioned around video container */}
      <div className="relative">
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
          {/* Speaking ring - positioned directly around the video container */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 -m-2 rounded-full pointer-events-none z-10"
                style={{
                  boxShadow: '0 0 0 0px rgba(255, 136, 0, 0.4), 0 0 20px rgba(255, 136, 0, 0.3)',
                }}
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
                  className="w-full h-full rounded-full border-[3px]"
                  style={{
                    borderColor: 'var(--ts-orange)',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Always render video element to allow track attachment */}
          <video
            ref={videoRef}
            key={`video-${name}`}
            autoPlay
            playsInline
            muted={isLocal}
            className="w-full h-full object-cover"
            style={{
              zIndex: hasVideo ? 10 : 0,
              opacity: hasVideo ? 1 : 0,
              visibility: hasVideo ? 'visible' : 'hidden',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent'
            }}
            onLoadedMetadata={() => {
              if (videoRef.current && attachedVideoTrackRef.current) {
                const hasStream = videoRef.current.srcObject !== null;
                const readyState = videoRef.current.readyState;
                const isMuted = attachedVideoTrackRef.current.isMuted();
                if (hasStream && !isMuted) {
                  setHasVideo(true);
                  // Force play safely
                  safePlayVideo(videoRef.current).catch(() => { });
                }
              }
            }}
            onPlaying={() => {
              if (videoRef.current && attachedVideoTrackRef.current) {
                const isMuted = attachedVideoTrackRef.current.isMuted();
                if (!isMuted) {
                  setHasVideo(true);
                }
              }
            }}
            onCanPlay={() => {
              if (videoRef.current && attachedVideoTrackRef.current) {
                const hasStream = videoRef.current.srcObject !== null;
                const readyState = videoRef.current.readyState;
                const isMuted = attachedVideoTrackRef.current.isMuted();
                if (hasStream && !isMuted) {
                  setHasVideo(true);
                  // Force play safely
                  safePlayVideo(videoRef.current).catch(() => { });
                }
              }
            }}
            onLoadedData={() => {
              if (videoRef.current && attachedVideoTrackRef.current) {
                const hasStream = videoRef.current.srcObject !== null;
                const readyState = videoRef.current.readyState;
                const isMuted = attachedVideoTrackRef.current.isMuted();
                if (hasStream && !isMuted) {
                  setHasVideo(true);
                  // Force play safely
                  safePlayVideo(videoRef.current).catch(() => { });
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
