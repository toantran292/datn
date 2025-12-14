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

/**
 * Simplified Jitsi Conference hook following official example.
 * Key principle: Keep it simple, let Jitsi handle the complexity.
 */
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
  const [screenShareTrack, setScreenShareTrack] = useState<JitsiTrack | null>(null);
  const [screenShareParticipantId, setScreenShareParticipantId] = useState<string | null>(null);
  const [dominantSpeakerId, setDominantSpeakerId] = useState<string | null>(null);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set());

  const conferenceRef = useRef<JitsiConference | null>(null);
  const initializedRef = useRef(false);

  // Simple ID normalization
  const normalizeId = (jid: string): string => {
    if (!jid) return '';
    const parts = jid.split('/');
    return parts.length > 1 ? parts[1] : parts[0];
  };

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    const audioTrack = localTracks.find(t => t.getType() === 'audio');
    if (!audioTrack) return;

    try {
      if (isAudioMuted) {
        await audioTrack.unmute();
        setIsAudioMuted(false);
      } else {
        await audioTrack.mute();
        setIsAudioMuted(true);
      }
    } catch (err) {
      console.error('[Conference] Error toggling audio:', err);
    }
  }, [localTracks, isAudioMuted]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    const videoTrack = localTracks.find(t => {
      if (t.getType() !== 'video') return false;
      const tAny = t as any;
      return tAny.getVideoType?.() !== 'desktop' && tAny.videoType !== 'desktop';
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
      console.error('[Conference] Error toggling video:', err);
    }
  }, [localTracks, isVideoMuted]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    if (!conferenceRef.current) return;

    try {
      if (isScreenSharing && screenShareTrack) {
        // Stop screen sharing
        await conferenceRef.current.removeTrack(screenShareTrack);
        screenShareTrack.dispose();
        setScreenShareTrack(null);
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const desktopTracks = await createDesktopTrack();
        const desktopTrack = desktopTracks.find(t => t.getType() === 'video');

        if (desktopTrack) {
          // Listen for track ended (user clicks stop sharing in browser)
          const stream = (desktopTrack as any).getOriginalStream?.();
          if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              videoTrack.addEventListener('ended', () => {
                if (conferenceRef.current) {
                  conferenceRef.current.removeTrack(desktopTrack).catch(() => {});
                }
                desktopTrack.dispose();
                setScreenShareTrack(null);
                setIsScreenSharing(false);
              });
            }
          }

          await conferenceRef.current.addTrack(desktopTrack);
          setScreenShareTrack(desktopTrack);
          setIsScreenSharing(true);
        }
      }
    } catch (err) {
      console.error('[Conference] Error toggling screen share:', err);
      setIsScreenSharing(false);
      setScreenShareTrack(null);
    }
  }, [isScreenSharing, screenShareTrack]);

  // Leave conference
  const leaveConference = useCallback(async () => {
    if (!conferenceRef.current) return;

    try {
      // Dispose screen share track
      if (screenShareTrack) {
        await conferenceRef.current.removeTrack(screenShareTrack);
        screenShareTrack.dispose();
      }

      // Dispose local tracks
      for (const track of localTracks) {
        await conferenceRef.current.removeTrack(track);
        track.dispose();
      }

      await conferenceRef.current.leave();
      setIsJoined(false);
      setLocalTracks([]);
      setIsScreenSharing(false);
      setScreenShareTrack(null);
    } catch (err) {
      console.error('[Conference] Error leaving:', err);
    }
  }, [localTracks, screenShareTrack]);

  // Effect: Check if screen share participant still has desktop track
  useEffect(() => {
    if (!isScreenSharing || !screenShareParticipantId) return;

    // Check if the participant who was sharing still has a desktop track
    const participant = participants.get(screenShareParticipantId);
    if (!participant) {
      // Participant left, clear screen share
      console.log('[Conference] Screen share participant left, clearing screen share');
      setScreenShareTrack(null);
      setIsScreenSharing(false);
      setScreenShareParticipantId(null);
      return;
    }

    // Check if participant still has a desktop video track
    const hasDesktopTrack = participant.tracks.some(track => {
      if (track.getType() !== 'video') return false;
      const trackAny = track as any;
      const videoType = trackAny.getVideoType?.() || trackAny.videoType;
      return videoType === 'desktop';
    });

    if (!hasDesktopTrack) {
      console.log('[Conference] Screen share participant no longer has desktop track, clearing');
      setScreenShareTrack(null);
      setIsScreenSharing(false);
      setScreenShareParticipantId(null);
    }
  }, [participants, isScreenSharing, screenShareParticipantId]);

  // Main effect: Initialize conference
  useEffect(() => {
    if (!connection || !roomName) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    let conf: JitsiConference | null = null;
    let tracks: JitsiTrack[] = [];

    const initConference = async () => {
      try {
        const JitsiMeetJS = getJitsiMeetJS();

        // Create conference with options for proper video handling
        conf = connection.initJitsiConference(roomName, {
          openBridgeChannel: true,
          p2p: { enabled: true }, // Enable P2P for small meetings
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        });

        conferenceRef.current = conf;
        setConference(conf);

        // === Event Handlers (following official example) ===

        // Conference joined
        conf.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, () => {
          console.log('[Conference] Joined');
          setIsJoined(true);

          // Set receiver constraints to request video from all participants
          try {
            (conf as any).setReceiverConstraints?.({
              lastN: -1, // Receive from all participants
              defaultConstraints: { maxHeight: 720 },
            });
            console.log('[Conference] Set receiver constraints');
          } catch (err) {
            console.log('[Conference] setReceiverConstraints not available or failed');
          }
        });

        // User joined
        conf.on(JitsiMeetJS.events.conference.USER_JOINED, (jid: string, user: JitsiParticipant) => {
          const id = normalizeId(jid);
          console.log('[Conference] User joined:', id);

          setParticipants(prev => {
            const next = new Map(prev);
            const existing = next.get(id);
            next.set(id, {
              id,
              name: user.getDisplayName() || existing?.name || 'Unknown',
              tracks: existing?.tracks || [],
            });
            return next;
          });
        });

        // User left
        conf.on(JitsiMeetJS.events.conference.USER_LEFT, (jid: string) => {
          const id = normalizeId(jid);
          console.log('[Conference] User left:', id);

          setParticipants(prev => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });

          // Clean up speaking state for left user
          setSpeakingParticipants(prev => {
            if (prev.has(id)) {
              const next = new Set(prev);
              next.delete(id);
              return next;
            }
            return prev;
          });
        });

        // Track added - KEY: Simple handling like official example
        conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track: JitsiTrack) => {
          const trackType = track.getType();
          const isLocal = track.isLocal();
          const trackId = track.getId?.() || 'unknown';
          const participantId = track.getParticipantId?.() || 'unknown';

          console.log('[Conference] Track added:', {
            type: trackType,
            isLocal,
            trackId,
            participantId,
            isMuted: track.isMuted?.(),
          });

          // For video tracks, log stream info
          if (trackType === 'video') {
            try {
              const stream = (track as any).getOriginalStream?.();
              if (stream) {
                const videoTracks = stream.getVideoTracks();
                console.log('[Conference] Video stream info:', {
                  streamId: stream.id,
                  videoTracksCount: videoTracks.length,
                  firstTrackState: videoTracks[0]?.readyState,
                  firstTrackEnabled: videoTracks[0]?.enabled,
                });
              }
            } catch (e) {
              // Ignore
            }
          }

          if (isLocal) {
            // Local track - add to localTracks if not exists
            setLocalTracks(prev => {
              const exists = prev.some(t => t === track);
              if (!exists) {
                return [...prev, track];
              }
              return prev;
            });
          } else {
            // Remote track - add to participant
            const pid = normalizeId(track.getParticipantId());

            setParticipants(prev => {
              const next = new Map(prev);
              const participant = next.get(pid);

              if (participant) {
                // Add track if not already exists
                const trackExists = participant.tracks.some(t => t === track);
                if (!trackExists) {
                  next.set(pid, {
                    ...participant,
                    tracks: [...participant.tracks, track],
                  });
                }
              } else {
                // Create new participant entry
                next.set(pid, {
                  id: pid,
                  name: 'Unknown',
                  tracks: [track],
                });
              }

              return next;
            });

            // Check if remote is sharing screen
            const trackAny = track as any;
            const videoType = trackAny.getVideoType?.() || trackAny.videoType;
            console.log('[Conference] Remote track added - checking for desktop:', {
              trackType: track.getType(),
              videoType,
              hasGetVideoType: typeof trackAny.getVideoType === 'function',
            });
            const isDesktop = track.getType() === 'video' && videoType === 'desktop';
            if (isDesktop) {
              console.log('[Conference] Remote screen share detected from participant:', pid);
              setScreenShareTrack(track);
              setIsScreenSharing(true);
              setScreenShareParticipantId(pid);

              // Listen for track ended/stopped events on the underlying stream
              try {
                const stream = trackAny.getOriginalStream?.() || trackAny.stream;
                if (stream) {
                  const videoTracks = stream.getVideoTracks();
                  if (videoTracks[0]) {
                    videoTracks[0].addEventListener('ended', () => {
                      console.log('[Conference] Remote screen share track ended via stream event');
                      setScreenShareTrack(null);
                      setIsScreenSharing(false);
                      setScreenShareParticipantId(null);
                    });
                  }
                }

                // Also listen on the JitsiTrack itself
                track.addEventListener('track.stopped', () => {
                  console.log('[Conference] Remote screen share - track.stopped event');
                  setScreenShareTrack(null);
                  setIsScreenSharing(false);
                  setScreenShareParticipantId(null);
                });
              } catch (e) {
                console.log('[Conference] Could not attach stream listeners:', e);
              }
            }
          }
        });

        // Track removed - KEY: Simple handling like official example
        conf.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track: JitsiTrack) => {
          const trackAny = track as any;
          const videoType = trackAny.getVideoType?.() || trackAny.videoType;
          console.log('[Conference] Track removed:', {
            type: track.getType(),
            isLocal: track.isLocal(),
            videoType,
            participantId: track.getParticipantId?.(),
          });

          if (track.isLocal()) {
            setLocalTracks(prev => prev.filter(t => t !== track));

            // Check if it was screen share track
            const isDesktop = track.getType() === 'video' &&
              (videoType === 'desktop');
            if (isDesktop) {
              setScreenShareTrack(null);
              setIsScreenSharing(false);
            }
          } else {
            // Remove from participant
            const pid = normalizeId(track.getParticipantId());

            setParticipants(prev => {
              const next = new Map(prev);
              const participant = next.get(pid);

              if (participant) {
                next.set(pid, {
                  ...participant,
                  tracks: participant.tracks.filter(t => t !== track),
                });
              }

              return next;
            });

            // Check if it was screen share track - multiple detection methods
            const isDesktop = track.getType() === 'video' && videoType === 'desktop';

            // Also clear if this track matches the current screenShareTrack
            setScreenShareTrack(currentTrack => {
              if (currentTrack === track || isDesktop) {
                console.log('[Conference] Remote screen share track removed, clearing state');
                setIsScreenSharing(false);
                return null;
              }
              return currentTrack;
            });
          }

          // Dispose track
          track.dispose();
        });

        // Track muted participants - used by audio level handler
        const mutedParticipantsRef = new Set<string>();

        // Track mute changed
        conf.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, (track: JitsiTrack) => {
          const trackAny = track as any;
          const videoType = trackAny.getVideoType?.() || trackAny.videoType;
          console.log('[Conference] Track mute changed:', {
            type: track.getType(),
            isLocal: track.isLocal(),
            isMuted: track.isMuted(),
            videoType,
          });

          if (track.isLocal()) {
            // Force re-render of local tracks
            setLocalTracks(prev => [...prev]);
          } else {
            // Force re-render of participants
            setParticipants(prev => new Map(prev));

            // Check if screen share track was muted (some Jitsi versions use mute instead of remove)
            if (track.getType() === 'video' && videoType === 'desktop' && track.isMuted()) {
              console.log('[Conference] Remote screen share muted, clearing state');
              setScreenShareTrack(null);
              setIsScreenSharing(false);
            }

            // Track muted state for audio tracks
            if (track.getType() === 'audio') {
              const pid = normalizeId(track.getParticipantId());
              if (track.isMuted()) {
                mutedParticipantsRef.add(pid);
                // Remove from speaking participants immediately
                setSpeakingParticipants(prev => {
                  const next = new Set(prev);
                  next.delete(pid);
                  return next;
                });
              } else {
                mutedParticipantsRef.delete(pid);
              }
            }
          }
        });

        // Display name changed
        conf.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, (jid: string, displayName: string) => {
          const id = normalizeId(jid);
          setParticipants(prev => {
            const next = new Map(prev);
            const participant = next.get(id);
            if (participant) {
              next.set(id, { ...participant, name: displayName || 'Unknown' });
            }
            return next;
          });
        });

        // Dominant speaker changed - track who is speaking
        conf.on(JitsiMeetJS.events.conference.DOMINANT_SPEAKER_CHANGED, (id: string) => {
          const speakerId = normalizeId(id);
          console.log('[Conference] Dominant speaker changed:', speakerId);
          setDominantSpeakerId(speakerId);
        });

        // Track audio levels to detect ALL speaking participants
        const SPEAKING_THRESHOLD = 0.1; // Threshold for considering someone speaking (increased to reduce false positives from ambient noise)
        const speakingTimeouts = new Map<string, NodeJS.Timeout>();

        conf.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED, (participantId: string, audioLevel: number) => {
          const pid = normalizeId(participantId);

          // Quick check: if participant is in muted set, skip immediately
          if (mutedParticipantsRef.has(pid)) {
            // Clear any existing timeout
            const existingTimeout = speakingTimeouts.get(pid);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              speakingTimeouts.delete(pid);
            }
            setSpeakingParticipants(prev => {
              if (prev.has(pid)) {
                const next = new Set(prev);
                next.delete(pid);
                return next;
              }
              return prev;
            });
            return;
          }

          const isSpeaking = audioLevel > SPEAKING_THRESHOLD;

          if (isSpeaking) {
            // Clear existing timeout - user is still speaking
            const existingTimeout = speakingTimeouts.get(pid);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              speakingTimeouts.delete(pid);
            }

            // Update speaking state immediately when speaking
            setSpeakingParticipants(prev => {
              if (!prev.has(pid)) {
                const next = new Set(prev);
                next.add(pid);
                return next;
              }
              return prev;
            });

            // Set timeout to remove speaking state after silence
            const timeout = setTimeout(() => {
              setSpeakingParticipants(prev => {
                if (prev.has(pid)) {
                  const next = new Set(prev);
                  next.delete(pid);
                  return next;
                }
                return prev;
              });
              speakingTimeouts.delete(pid);
            }, 600); // Timeout after 600ms of silence
            speakingTimeouts.set(pid, timeout);
          } else {
            // Not speaking - if there's no existing timeout, don't set one
            // The timeout from the last speaking event will handle cleanup
          }
        });

        // Local audio level will be checked after tracks are created
        let localAudioInterval: NodeJS.Timeout | null = null;

        // === Create local tracks ===
        tracks = await createLocalTracks({ audio: true, video: true });
        setLocalTracks(tracks);

        // Add tracks to conference
        for (const track of tracks) {
          await conf.addTrack(track);
        }

        // Now set up local audio level checking using Web Audio API
        const localAudioTrack = tracks.find(t => t.getType() === 'audio');
        if (localAudioTrack) {
          try {
            const stream = (localAudioTrack as any).getOriginalStream?.();
            if (stream) {
              const audioContext = new AudioContext();
              const source = audioContext.createMediaStreamSource(stream);
              const analyser = audioContext.createAnalyser();
              analyser.fftSize = 256;
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              let localSpeakingTimeout: NodeJS.Timeout | null = null;

              const checkLocalAudioLevel = () => {
                if (localAudioTrack.isMuted()) {
                  setIsLocalSpeaking(false);
                  return;
                }

                analyser.getByteFrequencyData(dataArray);
                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                const isSpeaking = average > 20; // Threshold for speaking (increased to reduce false positives from ambient noise)

                if (isSpeaking) {
                  setIsLocalSpeaking(true);
                  // Clear existing timeout
                  if (localSpeakingTimeout) {
                    clearTimeout(localSpeakingTimeout);
                  }
                  // Set timeout to stop speaking indicator after 500ms
                  localSpeakingTimeout = setTimeout(() => {
                    setIsLocalSpeaking(false);
                  }, 500);
                }
              };

              localAudioInterval = setInterval(checkLocalAudioLevel, 100);

              // Store audio context for cleanup
              (conf as any)._audioContext = audioContext;
            }
          } catch (err) {
            console.log('[Conference] Failed to set up local audio level detection:', err);
          }
        }

        // Set display name and join
        conf.setDisplayName(displayName);
        conf.join();

        // Store cleanup functions
        (conf as any)._localAudioInterval = localAudioInterval;
        (conf as any)._speakingTimeouts = speakingTimeouts;

      } catch (err) {
        console.error('[Conference] Error initializing:', err);
      }
    };

    initConference();

    // Cleanup
    return () => {
      if (conf) {
        // Clear intervals and timeouts
        if ((conf as any)._localAudioInterval) {
          clearInterval((conf as any)._localAudioInterval);
        }
        if ((conf as any)._speakingTimeouts) {
          for (const timeout of (conf as any)._speakingTimeouts.values()) {
            clearTimeout(timeout);
          }
        }
        // Close AudioContext
        if ((conf as any)._audioContext) {
          (conf as any)._audioContext.close().catch(() => {});
        }

        for (const track of tracks) {
          try {
            conf.removeTrack(track);
            track.dispose();
          } catch {}
        }
        conf.leave().catch(() => {});
      }
    };
  }, [connection, roomName, displayName]);

  return {
    conference,
    isJoined,
    participants,
    localTracks,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    screenShareTrack,
    isLocalSpeaking,
    dominantSpeakerId,
    speakingParticipants,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveConference,
  };
}
