import { useEffect, useState, useCallback, useRef } from 'react';
import { getJitsiMeetJS, createLocalTracks } from '@/lib/jitsi';
import type { JitsiConnection, JitsiConference, JitsiTrack, JitsiParticipant } from '@/types/jitsi';

export interface Participant {
  id: string;
  name: string;
  tracks: JitsiTrack[];
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
  const conferenceRef = useRef<JitsiConference | null>(null);
  const initializedRef = useRef(false);
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

  // Toggle audio mute
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
      console.error('[Jitsi] Error toggling audio:', err);
    }
  }, [localTracks, isAudioMuted]);

  // Toggle video mute
  const toggleVideo = useCallback(async () => {
    if (!conferenceRef.current) return;

    const videoTrack = localTracks.find(t => t.getType() === 'video');
    if (!videoTrack) return;

    try {
      if (isVideoMuted) {
        // Unmute the track
        await videoTrack.unmute();
        setIsVideoMuted(false);
        console.log('[Jitsi] Video unmuted');
      } else {
        // Mute the track
        await videoTrack.mute();
        setIsVideoMuted(true);
        console.log('[Jitsi] Video muted');
      }
    } catch (err) {
      console.error('[Jitsi] Error toggling video:', err);
    }
  }, [localTracks, isVideoMuted]);

  // Leave conference
  const leaveConference = useCallback(async () => {
    if (!conferenceRef.current) return;

    try {
      // Remove local tracks
      for (const track of localTracks) {
        if (conferenceRef.current) {
          await conferenceRef.current.removeTrack(track);
        }
        track.dispose();
      }

      await conferenceRef.current.leave();
      setIsJoined(false);
      setLocalTracks([]);
    } catch (err) {
      console.error('[Jitsi] Error leaving conference:', err);
    }
  }, [localTracks]);

  useEffect(() => {
    if (!connection || !roomName) return;
    // if (conferenceRef.current) return;
    let conf: JitsiConference | null = null;
    let tracks: JitsiTrack[] = [];

    const initConference = async () => {
      try {
        const JitsiMeetJS = getJitsiMeetJS();

        // Create conference
        const confOptions = {
          openBridgeChannel: true,
        };
        conf = connection.initJitsiConference(roomName, confOptions);
        conferenceRef.current = conf;
        setConference(conf);
        

        // Event handlers
        const handleConferenceJoined = () => {
          setIsJoined(true);

          if (conf) {
            const existingParticipants = conf.getParticipants();

            setParticipants(prev => {
              const next = new Map(prev);

              existingParticipants.forEach((participant: JitsiParticipant) => {
                const id = participant.getId();
                const displayName = participant.getDisplayName() || 'Unknown';

                next.set(id, {
                  id,
                  name: displayName,
                  tracks: []
                });
              });

              return next;
            });
          }
        };

        const handleConferenceLeft = () => {
          setIsJoined(false);
        };

        const handleUserJoined = (id: string, user: JitsiParticipant) => {
          const name = user.getDisplayName() || 'Unknown';

          setParticipants(prev => {
            const next = new Map(prev);
            const existing = next.get(id);

            if (existing) {
              next.set(id, { ...existing, name });
              return next;
            }

            // Khi chưa có participant → tạo với tracks rỗng
            next.set(id, { id, name, tracks: [] });
            return next;
          });
        };


        const handleUserLeft = (id: string) => {
          setParticipants(prev => {
            const next = new Map(prev);
            const participant = next.get(id);
            if (participant) {
              console.log(`[Jitsi] ${participant.name} has left the meeting`);
            }
            next.delete(id);
            return next;
          });
        };

        const handleDisplayNameChanged = (id: string, displayName: string) => {
          setParticipants(prev => {
            const next = new Map(prev);
            const participant = next.get(id);
            if (participant) {
              next.set(id, {
                ...participant,
                name: displayName || 'Unknown'
              });
            }
            return next;
          });
        };

       const handleTrackAdded = async (track: JitsiTrack) => {
          await ensureTrackId(track);

          if (track.isLocal()) {
            setLocalTracks(prev => {
              const exists = prev.some(t => t.getId() === track.getId());
              return exists ? prev : [...prev, track];
            });
            return;
          }

          const pid = track.getParticipantId();
          const type = track.getType();
          const trackId = track.getId();

          console.log('[handleTrackAdded] Processing track:', {
            trackId,
            type,
            pid,
            isLocal: track.isLocal()
          });

          setParticipants(prev => {
            const next = new Map(prev);
            let p = next.get(pid);

            console.log('[handleTrackAdded] Current participant:', {
              pid,
              name: p?.name || 'NOT_FOUND',
              existingTracks: p?.tracks.map(t => t.getId()) || []
            });

            if (!p) {
              // create stub but don't overwrite later!
              p = { id: pid, name: 'Unknown', tracks: [] };
            }

            // Check if track already exists (by ID)
            const existingTrack = p.tracks.find(t => t.getId() === trackId);
            if (existingTrack) {
              console.log('[handleTrackAdded] Track already exists, skipping:', trackId);
              return prev; // Return same reference to avoid re-render
            }

            const newTracks = [
              ...p.tracks.filter(t => t.getType() !== type),
              track
            ];

            console.log('[handleTrackAdded] Updated participant:', {
              pid,
              name: p.name,
              newTracks: newTracks.map(t => `${t.getType()}:${t.getId()}`)
            });

            next.set(pid, { ...p, tracks: newTracks });

            // Log all participants after update
            console.log('[handleTrackAdded] All participants after update:');
            next.forEach((participant, id) => {
              console.log(`  - ${participant.name} (${id}):`, participant.tracks.map(t => `${t.getType()}:${t.getId()}`));
            });

            return next;
          });
        };

        const handleTrackRemoved = (track: JitsiTrack) => {

          if (track.isLocal()) {
            // Remove from local tracks
            setLocalTracks(prev => prev.filter(t => t.getId() !== track.getId()));
            return;
          }

          const participantId = track.getParticipantId();
          setParticipants(prev => {
            const next = new Map(prev);
            const participant = next.get(participantId);
            if (participant) {
              // Create new participant object with filtered tracks array
              next.set(participantId, {
                ...participant,
                tracks: [...participant.tracks.filter(t => t.getId() !== track.getId())]
              });
            }
            return next;
          });
        };

        const handleTrackMuteChanged = (track: JitsiTrack) => {
          const participantId = track.getParticipantId();

          if (!participantId) {
            // Local track - force re-render by updating localTracks
            setLocalTracks(prev => [...prev]);
            return;
          }

          // Remote track - force re-render by updating the tracks array
          setParticipants(prev => {
            const next = new Map(prev);
            const participant = next.get(participantId);
            if (participant) {
              // Create new tracks array to trigger re-render
              next.set(participantId, {
                ...participant,
                tracks: [...participant.tracks]
              });
            }
            return next;
          });
        };

        // Register event listeners
        conf.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, handleConferenceJoined);
        conf.on(JitsiMeetJS.events.conference.CONFERENCE_LEFT, handleConferenceLeft);
        conf.on(JitsiMeetJS.events.conference.USER_JOINED, handleUserJoined);
        conf.on(JitsiMeetJS.events.conference.USER_LEFT, handleUserLeft);
        conf.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, handleDisplayNameChanged);
        conf.on(JitsiMeetJS.events.conference.TRACK_ADDED, handleTrackAdded);
        conf.on(JitsiMeetJS.events.conference.TRACK_REMOVED, handleTrackRemoved);
        conf.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, handleTrackMuteChanged);

        // Create local tracks
        tracks = await createLocalTracks({ audio: true, video: true });
        setLocalTracks(tracks);

        // Set display name
        conf.setDisplayName(displayName);

        // Join conference
        conf.join();

        // Add local tracks to conference
        for (const track of tracks) {
          await ensureTrackId(track);
          await conf.addTrack(track);
        }

        // await conf.join();
      } catch (err) {
        console.error('[Jitsi] Error initializing conference:', err);
      }
    };
    initConference();

    return () => {
      if (conf) {
        try {
          for (const track of tracks) {
            try {
              conf.removeTrack(track);
              track.dispose();
            } catch (e) {
              console.error('[Jitsi] Error removing track:', e);
            }
          }
          conf.leave();
        } catch (e) {
          console.error('[Jitsi] Error during conference cleanup:', e);
        }
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
    toggleAudio,
    toggleVideo,
    leaveConference,
  };
}
