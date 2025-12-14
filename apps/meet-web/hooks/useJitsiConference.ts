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
            const isDesktop = track.getType() === 'video' &&
              (trackAny.getVideoType?.() === 'desktop' || trackAny.videoType === 'desktop');
            if (isDesktop) {
              setScreenShareTrack(track);
              setIsScreenSharing(true);
            }
          }
        });

        // Track removed - KEY: Simple handling like official example
        conf.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track: JitsiTrack) => {
          console.log('[Conference] Track removed:', track.getType(), 'isLocal:', track.isLocal());

          if (track.isLocal()) {
            setLocalTracks(prev => prev.filter(t => t !== track));

            // Check if it was screen share track
            const trackAny = track as any;
            const isDesktop = track.getType() === 'video' &&
              (trackAny.getVideoType?.() === 'desktop' || trackAny.videoType === 'desktop');
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

            // Check if it was screen share track
            if (track === screenShareTrack) {
              setScreenShareTrack(null);
              setIsScreenSharing(false);
            }
          }

          // Dispose track
          track.dispose();
        });

        // Track mute changed
        conf.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, (track: JitsiTrack) => {
          if (track.isLocal()) {
            // Force re-render of local tracks
            setLocalTracks(prev => [...prev]);
          } else {
            // Force re-render of participants
            setParticipants(prev => new Map(prev));
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

        // === Create local tracks ===
        tracks = await createLocalTracks({ audio: true, video: true });
        setLocalTracks(tracks);

        // Add tracks to conference
        for (const track of tracks) {
          await conf.addTrack(track);
        }

        // Set display name and join
        conf.setDisplayName(displayName);
        conf.join();

      } catch (err) {
        console.error('[Conference] Error initializing:', err);
      }
    };

    initConference();

    // Cleanup
    return () => {
      if (conf) {
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
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveConference,
  };
}
