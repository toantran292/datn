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

export interface ReactionEvent {
  id: string;
  emoji: string;
  participantId: string;
  participantName: string;
  timestamp: number;
}

export interface CaptionEvent {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
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
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [captions, setCaptions] = useState<CaptionEvent[]>([]);
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);

  const conferenceRef = useRef<JitsiConference | null>(null);
  const initializedRef = useRef(false);
  const displayNameRef = useRef(displayName);

  // Keep displayNameRef in sync
  useEffect(() => {
    displayNameRef.current = displayName;
  }, [displayName]);

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

  // Send reaction
  const sendReaction = useCallback((emoji: string) => {
    if (!conferenceRef.current || !isJoined) return;

    try {
      // Use Jitsi's command/property system to broadcast reaction
      // We'll use setLocalParticipantProperty to broadcast to all participants
      const reactionData = JSON.stringify({
        emoji,
        timestamp: Date.now(),
      });

      try {
        conferenceRef.current.setLocalParticipantProperty('reaction', reactionData);
      } catch (e) {
        return;
      }

      // Add local reaction to display
      const reactionEvent: ReactionEvent = {
        id: `${Date.now()}-local`,
        emoji,
        participantId: 'local',
        participantName: displayNameRef.current,
        timestamp: Date.now(),
      };

      setReactions(prev => [...prev, reactionEvent]);

      // Clear the property after a short delay to allow re-sending same reaction
      setTimeout(() => {
        try {
          conferenceRef.current?.setLocalParticipantProperty('reaction', '');
        } catch (e) {
          // Ignore
        }
      }, 100);

    } catch (err) {
      console.error('[Conference] Error sending reaction:', err);
    }
  }, [isJoined]);

  // Remove expired reaction
  const removeReaction = useCallback((reactionId: string) => {
    setReactions(prev => prev.filter(r => r.id !== reactionId));
  }, []);

  // Toggle captions
  const toggleCaptions = useCallback(() => {
    setIsCaptionsEnabled(prev => !prev);
  }, []);

  // Send caption (local speech-to-text result)
  const sendCaption = useCallback((text: string, isFinal: boolean) => {
    if (!conferenceRef.current || !text.trim() || !isJoined) {
      console.log('[Caption] sendCaption skipped:', { hasConference: !!conferenceRef.current, text: text.trim(), isJoined });
      return;
    }

    console.log('[Caption] Sending caption:', { text: text.trim(), isFinal });

    try {
      const captionData = JSON.stringify({
        text: text.trim(),
        isFinal,
        timestamp: Date.now(),
      });

      // Only send if still connected
      try {
        conferenceRef.current.setLocalParticipantProperty('caption', captionData);
      } catch (e) {
        console.log('[Caption] setLocalParticipantProperty failed:', e);
        // Ignore errors when not connected
        return;
      }

      // Add local caption to display
      const captionEvent: CaptionEvent = {
        id: `${Date.now()}-local-${isFinal ? 'final' : 'interim'}`,
        participantId: 'local',
        participantName: displayNameRef.current,
        text: text.trim(),
        timestamp: Date.now(),
        isFinal,
      };

      // If interim, replace previous interim caption from self
      setCaptions(prev => {
        if (!isFinal) {
          // Remove previous interim captions from local
          const filtered = prev.filter(c =>
            !(c.participantId === 'local' && !c.isFinal)
          );
          return [...filtered, captionEvent];
        }
        // For final captions, just add
        return [...prev.slice(-10), captionEvent]; // Keep last 10 captions
      });

    } catch (err) {
      console.error('[Conference] Error sending caption:', err);
    }
  }, [isJoined]);

  // Clear old captions periodically
  useEffect(() => {
    if (!isCaptionsEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setCaptions(prev => prev.filter(c => now - c.timestamp < 10000)); // Keep captions for 10 seconds
    }, 5000);

    return () => clearInterval(interval);
  }, [isCaptionsEnabled]);

  // Leave conference
  const leaveConference = useCallback(async () => {
    if (!conferenceRef.current) return;

    const conf = conferenceRef.current;

    try {
      // Dispose screen share track
      if (screenShareTrack) {
        try {
          screenShareTrack.dispose();
        } catch {}
      }

      // Dispose local tracks
      for (const track of localTracks) {
        try {
          track.dispose();
        } catch {}
      }

      // Only leave if still connected
      try {
        const room = conf as any;
        if (room.room && room.room.joined) {
          await conf.leave();
        }
      } catch {}

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
          setIsJoined(true);

          // Set receiver constraints to request video from all participants
          try {
            (conf as any).setReceiverConstraints?.({
              lastN: -1, // Receive from all participants
              defaultConstraints: { maxHeight: 720 },
            });
          } catch (err) {
          }
        });

        // User joined
        conf.on(JitsiMeetJS.events.conference.USER_JOINED, (jid: string, user: JitsiParticipant) => {
          const id = normalizeId(jid);

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


          // For video tracks, log stream info
          if (trackType === 'video') {
            try {
              const stream = (track as any).getOriginalStream?.();
              if (stream) {
                const videoTracks = stream.getVideoTracks();
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
            const isDesktop = track.getType() === 'video' && videoType === 'desktop';
            if (isDesktop) {
              setScreenShareTrack(track);
              // Don't set isScreenSharing to true - that's only for local user
              // isScreenSharing controls the button highlight, screenShareTrack controls the view
              setScreenShareParticipantId(pid);

              // Listen for track ended/stopped events on the underlying stream
              try {
                const stream = trackAny.getOriginalStream?.() || trackAny.stream;
                if (stream) {
                  const videoTracks = stream.getVideoTracks();
                  if (videoTracks[0]) {
                    videoTracks[0].addEventListener('ended', () => {
                      setScreenShareTrack(null);
                      setScreenShareParticipantId(null);
                    });
                  }
                }

                // Also listen on the JitsiTrack itself
                track.addEventListener('track.stopped', () => {
                  setScreenShareTrack(null);
                  setScreenShareParticipantId(null);
                });
              } catch (e) {
              }
            }
          }
        });

        // Track removed - KEY: Simple handling like official example
        conf.on(JitsiMeetJS.events.conference.TRACK_REMOVED, (track: JitsiTrack) => {
          const trackAny = track as any;
          const videoType = trackAny.getVideoType?.() || trackAny.videoType;

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

          if (track.isLocal()) {
            // Force re-render of local tracks
            setLocalTracks(prev => [...prev]);
          } else {
            // Force re-render of participants
            setParticipants(prev => new Map(prev));

            // Check if screen share track was muted (some Jitsi versions use mute instead of remove)
            if (track.getType() === 'video' && videoType === 'desktop' && track.isMuted()) {
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

        // Participant property changed - used for reactions
        conf.on(JitsiMeetJS.events.conference.PARTICIPANT_PROPERTY_CHANGED, (
          participant: JitsiParticipant,
          propertyName: string,
          _oldValue: string,
          newValue: string
        ) => {
          if (propertyName === 'reaction' && newValue) {
            try {
              const reactionData = JSON.parse(newValue);
              const pid = normalizeId(participant.getId());
              const participantName = participant.getDisplayName() || 'Unknown';


              const reactionEvent: ReactionEvent = {
                id: `${reactionData.timestamp}-${pid}`,
                emoji: reactionData.emoji,
                participantId: pid,
                participantName,
                timestamp: reactionData.timestamp,
              };

              setReactions(prev => [...prev, reactionEvent]);
            } catch (err) {
              // Ignore invalid JSON or empty value
            }
          }

          // Handle captions from remote participants
          if (propertyName === 'caption' && newValue) {
            try {
              const captionData = JSON.parse(newValue);
              const pid = normalizeId(participant.getId());
              const participantName = participant.getDisplayName() || 'Unknown';


              const captionEvent: CaptionEvent = {
                id: `${captionData.timestamp}-${pid}-${captionData.isFinal ? 'final' : 'interim'}`,
                participantId: pid,
                participantName,
                text: captionData.text,
                timestamp: captionData.timestamp,
                isFinal: captionData.isFinal,
              };

              setCaptions(prev => {
                if (!captionData.isFinal) {
                  // Remove previous interim captions from this participant
                  const filtered = prev.filter(c =>
                    !(c.participantId === pid && !c.isFinal)
                  );
                  return [...filtered, captionEvent];
                }
                return [...prev.slice(-10), captionEvent];
              });
            } catch (err) {
              // Ignore invalid JSON or empty value
            }
          }
        });

        // Dominant speaker changed - track who is speaking
        conf.on(JitsiMeetJS.events.conference.DOMINANT_SPEAKER_CHANGED, (id: string) => {
          const speakerId = normalizeId(id);
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

        // Dispose tracks without removing from conference (may already be disconnected)
        for (const track of tracks) {
          try {
            track.dispose();
          } catch {}
        }

        // Only leave if still connected
        try {
          const room = conf as any;
          if (room.room && room.room.joined) {
            conf.leave().catch(() => {});
          }
        } catch {}
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
    reactions,
    captions,
    isCaptionsEnabled,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveConference,
    sendReaction,
    removeReaction,
    toggleCaptions,
    sendCaption,
  };
}
