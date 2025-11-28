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
          const displayName = user.getDisplayName() || 'Unknown';

          setParticipants(prev => {
            const next = new Map(prev);
            const existing = next.get(id);

            next.set(id, {
              id,
              name: displayName,
              tracks: existing ? [...existing.tracks] : [],
            });

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

          console.log('[handleTrackAdded] Track added:', {
            trackId: track.getId(),
            type: track.getType(),
            isLocal: track.isLocal(),
            participantId: track.getParticipantId()
          });

          // Skip local tracks
          if (track.isLocal()) {
            setLocalTracks(prev => {
              const exists = prev.some(t => t.getId() === track.getId());
              if (exists) return prev;
              return [...prev, track];
            });
            return;
          }

          const participantId = track.getParticipantId();
          const trackType = track.getType();
          const trackId = track.getId();

          setParticipants(prev => {
            const next = new Map(prev);
            let participant = next.get(participantId);
            console.log({name: participant});
            
            // 🌟 Tạo participant stub nếu chưa có
            if (!participant) {
              participant = {
                id: participantId,
                name: 'Unknown',
                tracks: []
              };
              next.set(participantId, participant);
              console.log('[handleTrackAdded] Created stub participant');
            }

            // 🌟 Chỉ update track của cùng loại
            const newTracks = [
              ...participant.tracks.filter(t => t.getType() !== trackType),
              track
            ];

            next.set(participantId, {
              ...participant,
              tracks: newTracks
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
