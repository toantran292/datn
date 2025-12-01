import { useEffect, useState, useCallback, useRef } from 'react';
import { getJitsiMeetJS, createLocalTracks, createDesktopTrack } from '@/lib/jitsi';
import type {
  JitsiConnection,
  JitsiConference,
  JitsiTrack,
  JitsiParticipant
} from '@/types/jitsi';

export interface Participant {
  id: string;
  name: string;
  tracks: JitsiTrack[];
  isSpeaking?: boolean;
}

export function useJitsiConference(
  connection: JitsiConnection | null,
  roomName: string | null,
  displayName: string
) {
  const [conference, setConference] = useState<JitsiConference | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [localTracks, setLocalTracks] = useState<JitsiTrack[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenSharingParticipantId, setScreenSharingParticipantId] = useState<string | null>(null);
  const [dominantSpeakerId, setDominantSpeakerId] = useState<string | null>(null);
  const [screenShareTrack, setScreenShareTrack] = useState<JitsiTrack | null>(null);
  const [audioLevels, setAudioLevels] = useState<Map<string, number>>(new Map());
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);

  const conferenceRef = useRef<JitsiConference | null>(null);
  const initializedRef = useRef(false);
  const originalVideoTrackRef = useRef<JitsiTrack | null>(null);
  const speakingTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function normalizeId(jid: string) {
    if (!jid) return '';
    const parts = jid.split('/');
    return parts.length > 1 ? parts[1] : parts[0];
  }
  function ensureTrackId(track: JitsiTrack) {
    return new Promise(resolve => {
      if (track.getId()) return resolve(track.getId());
      const interval = setInterval(() => {
        if (track.getId()) {
          clearInterval(interval);
          resolve(track.getId());
        }
      }, 10);
    });
  }

  // Toggle audio - same simple logic as toggle video
  const toggleAudio = useCallback(async () => {
    const audioTrack = localTracks.find((t: JitsiTrack) => t.getType() === 'audio');
    if (!audioTrack) return;

    try {
      if (isAudioMuted) {
        await audioTrack.unmute();
        setIsAudioMuted(false);
      } else {
        await audioTrack.mute();
        setIsAudioMuted(true);
        // Clear local speaking state when muting
        setLocalIsSpeaking(false);
      }
    } catch (err) {
      console.error('[Jitsi] Error toggling audio:', err);
    }
  }, [localTracks, isAudioMuted]);

  // Toggle video - always toggle camera track, never desktop track
  const toggleVideo = useCallback(async () => {
    // Always find camera track (not desktop track) to toggle
    const videoTrack = localTracks.find((t: JitsiTrack) => {
      const type = t.getType();
      if (type !== 'video') return false;
      const tAny = t as any;
      const isDesktop = tAny.getVideoType?.() === 'desktop' || tAny.videoType === 'desktop';
      return !isDesktop; // Only camera track, not desktop
    });

    if (!videoTrack) return;

    try {
      if (isVideoMuted) {
        await videoTrack.unmute();
        setIsVideoMuted(false);
      } else {
        await videoTrack.mute();
        setIsVideoMuted(true);
      }
    } catch (err) {
      console.error('[Jitsi] Error toggling video:', err);
    }
  }, [localTracks, isVideoMuted]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (!conferenceRef.current) return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing - remove desktop track only
        // Camera track is still in conference, no need to restore it
        if (screenShareTrack) {
          // Remove ended event listener if it exists
          const stream = (screenShareTrack as any).getOriginalStream?.() || (screenShareTrack as any).stream;
          if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            const endedListener = (screenShareTrack as any).__endedListener;
            if (videoTrack && endedListener) {
              videoTrack.removeEventListener('ended', endedListener);
            }
          }

          await conferenceRef.current.removeTrack(screenShareTrack);
          screenShareTrack.dispose();
          setScreenShareTrack(null);
        }

        // Camera track is still active in conference, just clear the reference
        originalVideoTrackRef.current = null;

        setIsScreenSharing(false);
        setScreenSharingParticipantId(null);
      } else {
        // Start screen sharing - ADD desktop track WITHOUT removing camera track
        // This allows remote participants to see both camera and desktop track
        // First, find and remove any existing desktop track to avoid duplicates
        const existingDesktopTrack = localTracks.find((t: JitsiTrack) => {
          const type = t.getType();
          return type === 'video' && ((t as any).getVideoType?.() === 'desktop' || (t as any).videoType === 'desktop');
        });

        if (existingDesktopTrack) {
          await conferenceRef.current.removeTrack(existingDesktopTrack);
          existingDesktopTrack.dispose();
          setLocalTracks((prev: JitsiTrack[]) => prev.filter((t: JitsiTrack) => t.getId() !== existingDesktopTrack.getId()));
        }

        // Find camera video track (not desktop) - KEEP IT in conference
        const currentVideoTrack = localTracks.find((t: JitsiTrack) => {
          const type = t.getType();
          return type === 'video' && ((t as any).getVideoType?.() !== 'desktop' && (t as any).videoType !== 'desktop');
        });

        // Store camera track reference but DON'T remove it from conference
        // Remote participants need both camera and desktop tracks
        if (currentVideoTrack) {
          originalVideoTrackRef.current = currentVideoTrack;
          // DO NOT remove camera track - keep it in conference
        }

        // Create and add desktop track (alongside camera track)
        const desktopTracks = await createDesktopTrack();
        const desktopTrack = desktopTracks.find((t: JitsiTrack) => t.getType() === 'video');

        if (desktopTrack) {
          await ensureTrackId(desktopTrack);

          // Listen for track ended event (when user stops sharing from browser)
          const handleTrackEnded = () => {
            console.log('[Jitsi] Desktop track ended - user stopped sharing from browser');
            // Stop screen sharing when track ends - always clear state regardless of current screenShareTrack value
            // The track will be removed via TRACK_REMOVED event, we just need to clear state here
            setScreenShareTrack(null);
            setIsScreenSharing(false);
            setScreenSharingParticipantId(null);
            originalVideoTrackRef.current = null;

            // Also try to remove track from conference if still connected
            if (conferenceRef.current) {
              conferenceRef.current.removeTrack(desktopTrack).catch((err: any) => {
                console.error('[Jitsi] Error removing desktop track on end:', err);
              });
            }
            try {
              desktopTrack.dispose();
            } catch (err) {
              // Ignore dispose errors
              console.error('[Jitsi] Error disposing desktop track:', err);
            }
          };

          // Get the underlying MediaStreamTrack and listen for ended event
          const stream = (desktopTrack as any).getOriginalStream?.() || (desktopTrack as any).stream;
          if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              videoTrack.addEventListener('ended', handleTrackEnded);
              // Store cleanup function
              (desktopTrack as any).__endedListener = handleTrackEnded;
            }
          }

          await conferenceRef.current.addTrack(desktopTrack);
          // Don't add to localTracks here - it will be added via TRACK_ADDED event
          // This prevents duplicates
          setScreenShareTrack(desktopTrack);
          setIsScreenSharing(true);
          // Normalize participant ID for consistency
          const localUserId = conferenceRef.current.myUserId();
          setScreenSharingParticipantId(normalizeId(localUserId));
        }
      }
    } catch (err) {
      console.error('[Jitsi] Error toggling screen share:', err);
      // Restore original video track on error
      if (originalVideoTrackRef.current && conferenceRef.current) {
        try {
          await ensureTrackId(originalVideoTrackRef.current);
          await conferenceRef.current.addTrack(originalVideoTrackRef.current);
          originalVideoTrackRef.current = null;
        } catch (restoreErr) {
          console.error('[Jitsi] Error restoring video track:', restoreErr);
        }
      }
      setIsScreenSharing(false);
      setScreenShareTrack(null);
    }
  }, [isScreenSharing, screenShareTrack, localTracks]);

  // Leave conference
  const leaveConference = useCallback(async () => {
    if (!conferenceRef.current) return;

    try {
      // Clean up screen share track
      if (screenShareTrack) {
        await conferenceRef.current.removeTrack(screenShareTrack);
        screenShareTrack.dispose();
      }

      for (const track of localTracks) {
        await conferenceRef.current.removeTrack(track);
        track.dispose();
      }

      await conferenceRef.current.leave();
      setIsJoined(false);
      setLocalTracks([]);
      setIsScreenSharing(false);
      setScreenShareTrack(null);
      originalVideoTrackRef.current = null;
    } catch (err) {
      console.error('[Jitsi] Error leaving conference:', err);
    }
  }, [localTracks, screenShareTrack]);

  useEffect(() => {
    if (!connection || !roomName) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    let conf: JitsiConference | null = null;
    let tracks: JitsiTrack[] = [];

    const initConference = async () => {
      try {
        const JitsiMeetJS = getJitsiMeetJS();

        // Create conference
        const confOptions = { openBridgeChannel: true };
        conf = connection.initJitsiConference(roomName, confOptions);

        conferenceRef.current = conf;
        setConference(conf);
        ; (window as any).jitsiConf = conf;
        /** Conference Events */
        const handleConferenceJoined = () => {
          setIsJoined(true);

          const existingParticipants = conf?.getParticipants() || [];
          setParticipants(() => {
            const next = new Map<string, Participant>();

            existingParticipants.forEach(p => {
              const id = normalizeId(p.getId());
              next.set(id, {
                id,
                name: p.getDisplayName() || 'Unknown',
                tracks: []
              });
            });

            return next;
          });
        };

        const handleUserJoined = (jid: string, user: JitsiParticipant) => {
          const id = normalizeId(jid);
          setParticipants((prev: Map<string, Participant>) => {
            const old = prev.get(id);
            return new Map(prev).set(id, {
              id,
              name: user.getDisplayName() || old?.name || "Unknown",
              tracks: old?.tracks || [],
            });
          });
        };

        const handleUserLeft = (jid: string) => {
          const id = normalizeId(jid);
          setParticipants((prev: Map<string, Participant>) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        };

        const handleDisplayNameChanged = (jid: string, displayName: string) => {
          const id = normalizeId(jid);
          setParticipants((prev: Map<string, Participant>) => {
            const next = new Map(prev);
            const p = next.get(id);
            if (p) next.set(id, { ...p, name: displayName || 'Unknown' });
            return next;
          });
        };

        const handleDominantSpeakerChanged = (jid: string, previousSpeakers?: string[], silence?: boolean) => {
          const id = normalizeId(jid);
          // Get local user ID from conference ref to ensure it's always available
          const localUserId = normalizeId(conferenceRef.current?.myUserId() || '');
          const isLocalSpeaking = id && localUserId && id === localUserId;

          setDominantSpeakerId(id);
          setLocalIsSpeaking(isLocalSpeaking);

          // Clear all existing speaking states first
          setParticipants((prev: Map<string, Participant>) => {
            const next = new Map(prev);
            next.forEach((p: Participant, pid: string) => {
              if (p.isSpeaking) {
                next.set(pid, { ...p, isSpeaking: false });
              }
            });
            return next;
          });

          // Clear all existing timeouts
          speakingTimeoutRef.current.forEach((timeout: ReturnType<typeof setTimeout>) => {
            clearTimeout(timeout);
          });
          speakingTimeoutRef.current.clear();

          // If not silence and there's a dominant speaker, set them as speaking
          if (!silence && id && id !== '') {
            // Update speaking state for the dominant speaker
            // Only update if participant already exists - don't create new "Unknown" entries
            setParticipants((prev: Map<string, Participant>) => {
              const next = new Map(prev);
              const p = next.get(id);
              if (p) {
                // Only update if participant exists
                next.set(id, { ...p, isSpeaking: true });
              }
              // Don't create new participant entry here - wait for USER_JOINED or TRACK_ADDED events
              return next;
            });

            // Set timeout to clear speaking state after 1.5 seconds if no new dominant speaker
            const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
              setParticipants((prev: Map<string, Participant>) => {
                const next = new Map(prev);
                const p = next.get(id);
                // Only clear if still the same dominant speaker (no new update)
                if (p && p.isSpeaking && dominantSpeakerId === id) {
                  next.set(id, { ...p, isSpeaking: false });
                }
                return next;
              });
              // Clear local speaking state if it was this speaker
              if (isLocalSpeaking) {
                setLocalIsSpeaking(false);
              }
              speakingTimeoutRef.current.delete(id);
            }, 1500);
            speakingTimeoutRef.current.set(id, timeout);
          } else if (silence) {
            // If silence, clear all speaking states
            setLocalIsSpeaking(false);
            setParticipants((prev: Map<string, Participant>) => {
              const next = new Map(prev);
              next.forEach((p: Participant, pid: string) => {
                if (p.isSpeaking) {
                  next.set(pid, { ...p, isSpeaking: false });
                }
              });
              return next;
            });
          }
        };

        /** Tracks */
        const handleTrackAdded = async (track: JitsiTrack) => {
          await ensureTrackId(track);

          // Handle local tracks
          if (track.isLocal()) {
            setLocalTracks((prev: JitsiTrack[]) => {
              // Check if track already exists
              const exists = prev.some((t: JitsiTrack) => t.getId() === track.getId());
              if (!exists) {
                return [...prev, track];
              }
              return prev;
            });
          }

          const pid = normalizeId(track.getParticipantId());
          const type = track.getType();

          // Check if this is a desktop track (screen share)
          // Try multiple ways to detect desktop track
          const trackAny = track as any;
          const isDesktopTrack = type === 'video' && (
            trackAny.getVideoType?.() === 'desktop' ||
            trackAny.videoType === 'desktop' ||
            trackAny.videoType === 'screen' ||
            (trackAny.getOriginalStream && trackAny.getOriginalStream().getVideoTracks()[0]?.getSettings().displaySurface)
          );

          // Update participants first to ensure track is available
          setParticipants((prev: Map<string, Participant>) => {
            const p = prev.get(pid);

            // Don't create "Unknown" participant - only update existing ones
            // Wait for USER_JOINED event to create participant entry
            if (!p) {
              return prev;
            }

            // Filter out old tracks of same type, but keep desktop and camera separate
            const filteredTracks = p.tracks.filter((t: JitsiTrack) => {
              if (t.getType() === type) {
                const tAny = t as any;
                const tIsDesktop = tAny.getVideoType?.() === 'desktop' || tAny.videoType === 'desktop';
                const trackIsDesktop = isDesktopTrack;
                // Keep if different type (one is desktop, one is camera)
                if (tIsDesktop !== trackIsDesktop) {
                  return true;
                }
                // Same type - replace old one
                return false;
              }
              return true;
            });

            const newTracks = [...filteredTracks, track];
            const updatedParticipant = { ...p, tracks: newTracks };

            return new Map(prev).set(pid, updatedParticipant);
          });

          // After updating participants, check if this is a desktop track and update screen sharing state
          if (isDesktopTrack) {
            if (track.isLocal()) {
              // Local desktop track
              setScreenShareTrack(track);
              setIsScreenSharing(true);
              // Normalize ID for consistency
              const localUserId = conferenceRef.current?.myUserId() || 'local';
              setScreenSharingParticipantId(normalizeId(localUserId));
            } else {
              // Remote participant is sharing screen
              // Store the remote desktop track so it can be accessed for rendering
              setScreenShareTrack(track);
              setScreenSharingParticipantId(pid);
              setIsScreenSharing(true);
              // Force a state update to trigger re-render
              setParticipants((prev: Map<string, Participant>) => {
                // Return new Map to force re-render
                return new Map(prev);
              });
            }
          }
        };

        const handleTrackRemoved = (track: JitsiTrack) => {
          if (track.isLocal()) {
            // Check if this was a desktop track being removed
            const isDesktopTrack = track.getType() === 'video' && ((track as any).getVideoType?.() === 'desktop' || (track as any).videoType === 'desktop');
            if (isDesktopTrack) {
              console.log('[Jitsi] Local desktop track removed - stopping screen share');

              // Remove ended event listener if it exists
              const stream = (track as any).getOriginalStream?.() || (track as any).stream;
              if (stream) {
                const videoTrack = stream.getVideoTracks()[0];
                const endedListener = (track as any).__endedListener;
                if (videoTrack && endedListener) {
                  videoTrack.removeEventListener('ended', endedListener);
                }
              }

              // Always clear screen sharing state when desktop track is removed
              setScreenShareTrack(null);
              setIsScreenSharing(false);
              setScreenSharingParticipantId(null);
              originalVideoTrackRef.current = null;
            }

            setLocalTracks((prev: JitsiTrack[]) =>
              prev.filter((t: JitsiTrack) => t.getId() !== track.getId())
            );
            return;
          }

          const pid = normalizeId(track.getParticipantId());

          // Check if this was a desktop track being removed
          const isDesktopTrack = track.getType() === 'video' && ((track as any).getVideoType?.() === 'desktop' || (track as any).videoType === 'desktop');
          if (isDesktopTrack) {
            console.log('[Jitsi] Remote desktop track removed - checking if should stop screen share', {
              pid,
              screenSharingParticipantId,
              trackParticipantId: track.getParticipantId(),
              trackId: track.getId(),
              screenShareTrackId: screenShareTrack?.getId(),
              isLocal: track.isLocal()
            });

            // First check: Is this the exact track we're storing?
            const isExactTrack = screenShareTrack && (
              track.getId() === screenShareTrack.getId() ||
              track === screenShareTrack
            );

            // Second check: Is this from the screen sharing participant?
            // Normalize both IDs for comparison - ensure consistent comparison
            const normalizedSharingId = screenSharingParticipantId ? normalizeId(screenSharingParticipantId) : null;
            const normalizedPid = normalizeId(pid);

            // Also check the original participant ID from track (before normalization)
            const originalParticipantId = track.getParticipantId();
            const normalizedOriginalId = normalizeId(originalParticipantId);

            // If this is the screen sharing participant, stop screen sharing
            // Check multiple ways to ensure we catch the match
            const isSharingParticipant =
              isExactTrack ||
              normalizedPid === normalizedSharingId ||
              pid === screenSharingParticipantId ||
              normalizedPid === screenSharingParticipantId ||
              normalizedOriginalId === normalizedSharingId ||
              originalParticipantId === screenSharingParticipantId ||
              (screenSharingParticipantId && normalizeId(screenSharingParticipantId) === normalizedPid);

            if (isSharingParticipant) {
              console.log('[Jitsi] Remote desktop track removed - stopping screen share view', {
                matched: true,
                isExactTrack,
                pid,
                screenSharingParticipantId,
                normalizedPid,
                normalizedSharingId
              });
              setScreenShareTrack(null);
              setScreenSharingParticipantId(null);
              setIsScreenSharing(false);
            } else {
              console.log('[Jitsi] Remote desktop track removed but not from sharing participant', {
                isExactTrack,
                pid,
                screenSharingParticipantId,
                normalizedPid,
                normalizedSharingId
              });
            }
          }

          setParticipants((prev: Map<string, Participant>) => {
            const next = new Map(prev);
            const p = next.get(pid);
            if (p) {
              const updatedTracks = p.tracks.filter((t: JitsiTrack) => t.getId() !== track.getId());
              next.set(pid, {
                ...p,
                tracks: updatedTracks
              });

              // After removing track, check if this participant was sharing screen and no longer has desktop track
              if (isDesktopTrack && screenSharingParticipantId) {
                const normalizedSharingId = normalizeId(screenSharingParticipantId);
                const normalizedPid = normalizeId(pid);

                // If this is the sharing participant and no desktop track remains, clear screen sharing
                if (normalizedPid === normalizedSharingId || pid === screenSharingParticipantId) {
                  const hasDesktopTrack = updatedTracks.some((t: JitsiTrack) => {
                    const type = t.getType();
                    if (type !== 'video') return false;
                    const tAny = t as any;
                    return tAny.getVideoType?.() === 'desktop' || tAny.videoType === 'desktop';
                  });

                  if (!hasDesktopTrack) {
                    console.log('[Jitsi] Sharing participant no longer has desktop track - clearing screen share state');
                    setScreenShareTrack(null);
                    setScreenSharingParticipantId(null);
                    setIsScreenSharing(false);
                  }
                }
              }
            }
            return next;
          });
        };

        const handleTrackMuteChanged = (track: JitsiTrack) => {
          if (track.isLocal()) {
            // Force re-render local tracks to update mute state
            setLocalTracks((prev: JitsiTrack[]) => [...prev]);

            // Clear local speaking state if audio track is muted
            if (track.getType() === 'audio' && track.isMuted()) {
              setLocalIsSpeaking(false);
            }
            return;
          }

          // Normalize participant ID for remote tracks
          const pid = normalizeId(track.getParticipantId());
          if (!pid) {
            console.warn('[Jitsi] Track mute changed but no participant ID:', track.getId());
            return;
          }

          // Clear speaking state if audio track is muted
          if (track.getType() === 'audio' && track.isMuted()) {
            setParticipants((prev: Map<string, Participant>) => {
              const next = new Map(prev);
              const p = next.get(pid);
              if (p && p.isSpeaking) {
                next.set(pid, { ...p, isSpeaking: false });
              }
              return next;
            });

            // Clear timeout for this participant
            if (speakingTimeoutRef.current.has(pid)) {
              const timeout = speakingTimeoutRef.current.get(pid);
              if (timeout) {
                clearTimeout(timeout);
              }
              speakingTimeoutRef.current.delete(pid);
            }
          }

          // Force re-render to update mute state in UI
          setParticipants((prev: Map<string, Participant>) => {
            const next = new Map(prev);
            const p = next.get(pid);
            if (p) {
              // Update tracks array to trigger re-render
              next.set(pid, {
                ...p,
                tracks: p.tracks.map((t: JitsiTrack) =>
                  t.getId() === track.getId() ? track : t
                )
              });
            }
            return next;
          });
        };

        /** Register conference event listeners */
        conf.on(JitsiMeetJS.events.conference.USER_JOINED, handleUserJoined);
        conf.on(JitsiMeetJS.events.conference.USER_LEFT, handleUserLeft);
        conf.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, handleDisplayNameChanged);
        conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, handleTrackAdded);
        conf.on(JitsiMeetJS.events.conference.TRACK_REMOVED, handleTrackRemoved);
        conf.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, handleTrackMuteChanged);
        conf.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, handleConferenceJoined);

        // Listen for dominant speaker changes
        if (JitsiMeetJS.events.conference.DOMINANT_SPEAKER_CHANGED) {
          conf.on(JitsiMeetJS.events.conference.DOMINANT_SPEAKER_CHANGED, handleDominantSpeakerChanged);
        }

        /** Local tracks */
        tracks = await createLocalTracks({ audio: true, video: true });
        setLocalTracks(tracks);

        conf.setDisplayName(displayName);
        conf.join();

        // Add local tracks
        for (const track of tracks) {
          await ensureTrackId(track);
          await conf.addTrack(track);
        }
      } catch (err) {
        console.error('[Jitsi] Error initializing conference:', err);
      }
    };

    initConference();

    return () => {
      // Cleanup speaking timeouts
      speakingTimeoutRef.current.forEach((timeout: ReturnType<typeof setTimeout>) => {
        clearTimeout(timeout);
      });
      speakingTimeoutRef.current.clear();

      if (conf) {
        for (const track of tracks) {
          try {
            conf.removeTrack(track);
            track.dispose();
          } catch { }
        }
        conf.leave();
      }
    };
  }, [connection, roomName, displayName]);

  // Monitor local audio level to detect local speaking
  // Jitsi may not always send DOMINANT_SPEAKER_CHANGED for local user
  useEffect(() => {
    if (!isJoined || isAudioMuted) {
      setLocalIsSpeaking(false);
      return;
    }

    const audioTrack = localTracks.find((t: JitsiTrack) => t.getType() === 'audio');
    if (!audioTrack || audioTrack.isMuted()) {
      setLocalIsSpeaking(false);
      return;
    }

    // Use AudioContext to analyze audio level from MediaStream
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let animationFrameId: number | null = null;

    try {
      // Get MediaStream from JitsiTrack
      const stream = (audioTrack as any).getOriginalStream?.() || (audioTrack as any).stream;
      if (!stream) {
        setLocalIsSpeaking(false);
        return;
      }

      const mediaStreamTracks = stream.getAudioTracks();
      if (mediaStreamTracks.length === 0) {
        setLocalIsSpeaking(false);
        return;
      }

      // Create AudioContext to analyze audio
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      // Check audio level periodically
      const checkAudioLevel = () => {
        if (!analyser || !dataArray) return;

        analyser.getByteFrequencyData(dataArray as Uint8Array);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold: average > 5 indicates speaking (can be adjusted)
        const isLocalSpeakingNow = average > 5;
        setLocalIsSpeaking(isLocalSpeakingNow);

        animationFrameId = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
    } catch (e) {
      // Fallback: try Jitsi's getAudioLevel if AudioContext fails
      const checkInterval = setInterval(() => {
        try {
          const level = (audioTrack as any).getAudioLevel?.() || 0;
          const isLocalSpeakingNow = level > 0.01;
          setLocalIsSpeaking(isLocalSpeakingNow);
        } catch (err) {
          // Ignore errors
        }
      }, 100);

      return () => {
        clearInterval(checkInterval);
        if (audioContext) {
          audioContext.close().catch(() => { });
        }
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }

    return () => {
      if (audioContext) {
        audioContext.close().catch(() => { });
      }
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [localTracks, isJoined, isAudioMuted]);

  // Safety check: Clear screen sharing state if track is missing
  useEffect(() => {
    if (isScreenSharing && screenSharingParticipantId) {
      // Check if we still have a desktop track for the sharing participant
      let hasDesktopTrack = false;

      // Check local tracks if local is sharing
      if (screenSharingParticipantId === 'local' || normalizeId(conferenceRef.current?.myUserId() || '') === normalizeId(screenSharingParticipantId)) {
        hasDesktopTrack = localTracks.some((t: JitsiTrack) => {
          const type = t.getType();
          if (type !== 'video') return false;
          const tAny = t as any;
          return tAny.getVideoType?.() === 'desktop' || tAny.videoType === 'desktop';
        });
      } else {
        // Check remote participant's tracks
        const sharingParticipant = participants.get(screenSharingParticipantId);
        if (sharingParticipant) {
          hasDesktopTrack = sharingParticipant.tracks.some((t: JitsiTrack) => {
            const type = t.getType();
            if (type !== 'video') return false;
            const tAny = t as any;
            return tAny.getVideoType?.() === 'desktop' || tAny.videoType === 'desktop';
          });
        }
      }

      // Also check if screenShareTrack exists and is valid
      if (!hasDesktopTrack && screenShareTrack) {
        // Check if the stored track is still valid
        try {
          const trackId = screenShareTrack.getId();
          if (trackId) {
            hasDesktopTrack = true;
          }
        } catch (e) {
          // Track is disposed, not valid
          hasDesktopTrack = false;
        }
      }

      // If no desktop track found for the sharing participant, clear screen sharing state
      if (!hasDesktopTrack) {
        console.log('[Jitsi] Safety check: Clearing screen sharing state - no desktop track found for sharing participant', {
          screenSharingParticipantId,
          hasScreenShareTrack: !!screenShareTrack
        });
        setScreenShareTrack(null);
        setIsScreenSharing(false);
        setScreenSharingParticipantId(null);
        originalVideoTrackRef.current = null;
      }
    }
  }, [isScreenSharing, screenSharingParticipantId, screenShareTrack, localTracks, participants]);

  return {
    conference,
    isJoined,
    participants,
    localTracks,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    screenSharingParticipantId,
    dominantSpeakerId,
    localIsSpeaking,
    screenShareTrack,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveConference,
  };
}
