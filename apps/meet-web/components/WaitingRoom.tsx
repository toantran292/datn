'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Mic, MicOff, Video, VideoOff, Settings,
  ChevronDown, Users, Loader2
} from 'lucide-react';

interface DeviceInfo {
  deviceId: string;
  label: string;
}

interface WaitingRoomProps {
  userName: string;
  onJoin: () => void;
  isJoining?: boolean;
}

export function WaitingRoom({ userName, onJoin, isJoining = false }: WaitingRoomProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [showMicDropdown, setShowMicDropdown] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Get available devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoDevices = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
        }));

      const audioDevices = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
        }));

      setCameras(videoDevices);
      setMicrophones(audioDevices);

      if (!selectedCamera && videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      if (!selectedMic && audioDevices.length > 0) {
        setSelectedMic(audioDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Failed to get devices:', err);
    }
  }, [selectedCamera, selectedMic]);

  // Start camera stream
  const startStream = useCallback(async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: isCameraOn ? {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
        audio: isMicOn ? {
          deviceId: selectedMic ? { exact: selectedMic } : undefined,
        } : false,
      };

      // Only request if at least one is enabled
      if (!isCameraOn && !isMicOn) {
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current && isCameraOn) {
        videoRef.current.srcObject = stream;
      }

      setPermissionDenied(false);
      await getDevices();
    } catch (err: any) {
      console.error('Failed to start stream:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
      }
    }
  }, [isCameraOn, isMicOn, selectedCamera, selectedMic, getDevices]);

  // Initialize on mount
  useEffect(() => {
    startStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Restart stream when camera/mic selection changes
  useEffect(() => {
    if (selectedCamera || selectedMic) {
      startStream();
    }
  }, [selectedCamera, selectedMic]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    const newState = !isCameraOn;
    setIsCameraOn(newState);

    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = newState;
      }
    }

    if (!newState && videoRef.current) {
      videoRef.current.srcObject = null;
    } else if (newState) {
      startStream();
    }
  }, [isCameraOn, startStream]);

  // Toggle mic
  const toggleMic = useCallback(() => {
    const newState = !isMicOn;
    setIsMicOn(newState);

    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = newState;
      }
    }
  }, [isMicOn]);

  // Handle join - stop preview stream before joining
  const handleJoin = useCallback(() => {
    // Store preferences
    localStorage.setItem('meetingCameraEnabled', String(isCameraOn));
    localStorage.setItem('meetingMicEnabled', String(isMicOn));
    if (selectedCamera) localStorage.setItem('meetingCameraId', selectedCamera);
    if (selectedMic) localStorage.setItem('meetingMicId', selectedMic);

    // Stop preview stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    onJoin();
  }, [isCameraOn, isMicOn, selectedCamera, selectedMic, onJoin]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--ts-bg-dark)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ color: 'var(--ts-text-primary)' }}
          >
            Ready to join?
          </h1>
          <p style={{ color: 'var(--ts-text-secondary)' }}>
            Set up your camera and microphone before joining
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
          {/* Video Preview */}
          <div
            className="relative w-full lg:w-[640px] aspect-video rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--ts-card-surface)',
              border: '1px solid var(--ts-border)',
            }}
          >
            {isCameraOn && !permissionDenied ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                {permissionDenied ? (
                  <>
                    <VideoOff className="w-16 h-16 mb-4" style={{ color: 'var(--ts-text-secondary)' }} />
                    <p style={{ color: 'var(--ts-text-secondary)' }}>Camera access denied</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--ts-text-muted)' }}>
                      Please allow camera access in your browser settings
                    </p>
                  </>
                ) : (
                  <>
                    {/* Avatar when camera is off */}
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold mb-4"
                      style={{
                        background: 'linear-gradient(135deg, var(--ts-orange), var(--ts-teal))',
                        color: 'white',
                      }}
                    >
                      {getInitials(userName)}
                    </div>
                    <p style={{ color: 'var(--ts-text-primary)' }}>{userName}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--ts-text-secondary)' }}>
                      Camera is off
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Name badge */}
            {isCameraOn && !permissionDenied && (
              <div
                className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span className="text-sm text-white">{userName}</span>
              </div>
            )}
          </div>

          {/* Controls Panel */}
          <div
            className="w-full lg:w-auto p-6 rounded-2xl"
            style={{
              backgroundColor: 'var(--ts-card-surface)',
              border: '1px solid var(--ts-border)',
            }}
          >
            {/* Device Controls */}
            <div className="space-y-4 mb-6">
              {/* Camera Control */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-xl transition-all ${
                    isCameraOn
                      ? 'bg-ts-teal/20 text-ts-teal'
                      : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <div className="flex-1 relative">
                  <button
                    onClick={() => setShowCameraDropdown(!showCameraDropdown)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm"
                    style={{
                      backgroundColor: 'var(--ts-input-bg)',
                      color: 'var(--ts-text-primary)',
                    }}
                  >
                    <span className="truncate">
                      {cameras.find(c => c.deviceId === selectedCamera)?.label || 'Select camera'}
                    </span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
                  </button>

                  {showCameraDropdown && cameras.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto"
                      style={{
                        backgroundColor: 'var(--ts-card-surface)',
                        border: '1px solid var(--ts-border)',
                      }}
                    >
                      {cameras.map(camera => (
                        <button
                          key={camera.deviceId}
                          onClick={() => {
                            setSelectedCamera(camera.deviceId);
                            setShowCameraDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors"
                          style={{ color: 'var(--ts-text-primary)' }}
                        >
                          {camera.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Microphone Control */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-xl transition-all ${
                    isMicOn
                      ? 'bg-ts-teal/20 text-ts-teal'
                      : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <div className="flex-1 relative">
                  <button
                    onClick={() => setShowMicDropdown(!showMicDropdown)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm"
                    style={{
                      backgroundColor: 'var(--ts-input-bg)',
                      color: 'var(--ts-text-primary)',
                    }}
                  >
                    <span className="truncate">
                      {microphones.find(m => m.deviceId === selectedMic)?.label || 'Select microphone'}
                    </span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
                  </button>

                  {showMicDropdown && microphones.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto"
                      style={{
                        backgroundColor: 'var(--ts-card-surface)',
                        border: '1px solid var(--ts-border)',
                      }}
                    >
                      {microphones.map(mic => (
                        <button
                          key={mic.deviceId}
                          onClick={() => {
                            setSelectedMic(mic.deviceId);
                            setShowMicDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors"
                          style={{ color: 'var(--ts-text-primary)' }}
                        >
                          {mic.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full py-3.5 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              style={{
                background: isJoining
                  ? 'var(--ts-teal)'
                  : 'linear-gradient(135deg, var(--ts-orange), var(--ts-teal))',
              }}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Join Meeting
                </>
              )}
            </button>

            {/* Info text */}
            <p
              className="text-xs text-center mt-4"
              style={{ color: 'var(--ts-text-muted)' }}
            >
              You can change these settings during the meeting
            </p>
          </div>
        </div>
      </motion.div>

      {/* Click outside to close dropdowns */}
      {(showCameraDropdown || showMicDropdown) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowCameraDropdown(false);
            setShowMicDropdown(false);
          }}
        />
      )}
    </div>
  );
}
