'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Mic, Image, Check, Upload } from 'lucide-react';

interface DeviceInfo {
  deviceId: string;
  label: string;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentCameraId?: string;
  currentMicId?: string;
  currentBackground?: string;
  onCameraChange: (deviceId: string) => void;
  onMicChange: (deviceId: string) => void;
  onBackgroundChange: (background: BackgroundOption) => void;
}

export interface BackgroundOption {
  type: 'none' | 'blur' | 'image';
  value?: string; // URL for image backgrounds
  name?: string;
}

const PRESET_BACKGROUNDS: BackgroundOption[] = [
  { type: 'none', name: 'None' },
  { type: 'blur', name: 'Blur' },
  { type: 'image', value: '/backgrounds/office.jpg', name: 'Office' },
  { type: 'image', value: '/backgrounds/nature.jpg', name: 'Nature' },
  { type: 'image', value: '/backgrounds/beach.jpg', name: 'Beach' },
];

export function SettingsPanel({
  isOpen,
  onClose,
  currentCameraId,
  currentMicId,
  currentBackground,
  onCameraChange,
  onMicChange,
  onBackgroundChange,
}: SettingsPanelProps) {
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState(currentCameraId || '');
  const [selectedMic, setSelectedMic] = useState(currentMicId || '');
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption>(
    { type: 'none' }
  );
  const [activeTab, setActiveTab] = useState<'devices' | 'background'>('devices');
  const [customBackgrounds, setCustomBackgrounds] = useState<BackgroundOption[]>([]);

  // Get available devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

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

        // Set default selections if not already set
        if (!selectedCamera && videoDevices.length > 0) {
          setSelectedCamera(currentCameraId || videoDevices[0].deviceId);
        }
        if (!selectedMic && audioDevices.length > 0) {
          setSelectedMic(currentMicId || audioDevices[0].deviceId);
        }
      } catch (err) {
        console.error('[Settings] Failed to get devices:', err);
      }
    };

    if (isOpen) {
      getDevices();
    }
  }, [isOpen, currentCameraId, currentMicId, selectedCamera, selectedMic]);

  // Handle camera change
  const handleCameraChange = useCallback((deviceId: string) => {
    setSelectedCamera(deviceId);
    onCameraChange(deviceId);
  }, [onCameraChange]);

  // Handle mic change
  const handleMicChange = useCallback((deviceId: string) => {
    setSelectedMic(deviceId);
    onMicChange(deviceId);
  }, [onMicChange]);

  // Handle background change
  const handleBackgroundChange = useCallback((bg: BackgroundOption) => {
    setSelectedBackground(bg);
    onBackgroundChange(bg);
  }, [onBackgroundChange]);

  // Handle custom background upload
  const handleBackgroundUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newBg: BackgroundOption = {
        type: 'image',
        value: dataUrl,
        name: file.name.split('.')[0],
      };
      setCustomBackgrounds(prev => [...prev, newBg]);
      handleBackgroundChange(newBg);
    };
    reader.readAsDataURL(file);
  }, [handleBackgroundChange]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
          style={{
            background: 'var(--ts-card-surface)',
            border: '1px solid var(--ts-border)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--ts-border)' }}>
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--ts-border)' }}>
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'devices'
                  ? 'text-ts-orange border-b-2 border-ts-orange'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Devices
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'background'
                  ? 'text-ts-orange border-b-2 border-ts-orange'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Background
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'devices' ? (
              <div className="space-y-6">
                {/* Camera Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-3">
                    <Camera className="w-4 h-4" />
                    Camera
                  </label>
                  <div className="space-y-2">
                    {cameras.map((camera) => (
                      <button
                        key={camera.deviceId}
                        onClick={() => handleCameraChange(camera.deviceId)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                          selectedCamera === camera.deviceId
                            ? 'bg-ts-orange/20 border border-ts-orange'
                            : 'bg-white/5 border border-transparent hover:bg-white/10'
                        }`}
                      >
                        <span className="text-sm text-white truncate">{camera.label}</span>
                        {selectedCamera === camera.deviceId && (
                          <Check className="w-4 h-4 text-ts-orange flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {cameras.length === 0 && (
                      <p className="text-white/40 text-sm text-center py-4">No cameras found</p>
                    )}
                  </div>
                </div>

                {/* Microphone Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-3">
                    <Mic className="w-4 h-4" />
                    Microphone
                  </label>
                  <div className="space-y-2">
                    {microphones.map((mic) => (
                      <button
                        key={mic.deviceId}
                        onClick={() => handleMicChange(mic.deviceId)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                          selectedMic === mic.deviceId
                            ? 'bg-ts-teal/20 border border-ts-teal'
                            : 'bg-white/5 border border-transparent hover:bg-white/10'
                        }`}
                      >
                        <span className="text-sm text-white truncate">{mic.label}</span>
                        {selectedMic === mic.deviceId && (
                          <Check className="w-4 h-4 text-ts-teal flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {microphones.length === 0 && (
                      <p className="text-white/40 text-sm text-center py-4">No microphones found</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-3">
                  <Image className="w-4 h-4" />
                  Virtual Background
                </label>

                {/* Background Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* None option */}
                  <button
                    onClick={() => handleBackgroundChange({ type: 'none', name: 'None' })}
                    className={`aspect-video rounded-xl flex items-center justify-center transition-all ${
                      selectedBackground.type === 'none'
                        ? 'ring-2 ring-ts-orange'
                        : 'hover:ring-2 hover:ring-white/30'
                    }`}
                    style={{ background: 'var(--ts-bg-dark)' }}
                  >
                    <span className="text-xs text-white/60">None</span>
                  </button>

                  {/* Blur option */}
                  <button
                    onClick={() => handleBackgroundChange({ type: 'blur', name: 'Blur' })}
                    className={`aspect-video rounded-xl flex items-center justify-center transition-all ${
                      selectedBackground.type === 'blur'
                        ? 'ring-2 ring-ts-orange'
                        : 'hover:ring-2 hover:ring-white/30'
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,136,0,0.3), rgba(0,196,171,0.3))',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <span className="text-xs text-white/80">Blur</span>
                  </button>

                  {/* Preset backgrounds */}
                  {PRESET_BACKGROUNDS.filter(bg => bg.type === 'image').map((bg, index) => (
                    <button
                      key={index}
                      onClick={() => handleBackgroundChange(bg)}
                      className={`aspect-video rounded-xl overflow-hidden transition-all relative ${
                        selectedBackground.value === bg.value
                          ? 'ring-2 ring-ts-orange'
                          : 'hover:ring-2 hover:ring-white/30'
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${bg.value})`,
                          backgroundColor: 'var(--ts-bg-dark)',
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-1">
                        <span className="text-[10px] text-white/80">{bg.name}</span>
                      </div>
                    </button>
                  ))}

                  {/* Custom uploaded backgrounds */}
                  {customBackgrounds.map((bg, index) => (
                    <button
                      key={`custom-${index}`}
                      onClick={() => handleBackgroundChange(bg)}
                      className={`aspect-video rounded-xl overflow-hidden transition-all relative ${
                        selectedBackground.value === bg.value
                          ? 'ring-2 ring-ts-orange'
                          : 'hover:ring-2 hover:ring-white/30'
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${bg.value})` }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-1">
                        <span className="text-[10px] text-white/80 truncate px-1">{bg.name}</span>
                      </div>
                    </button>
                  ))}

                  {/* Upload button */}
                  <label
                    className="aspect-video rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-white/40 mb-1" />
                    <span className="text-[10px] text-white/40">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <p className="text-xs text-white/40 mt-4">
                  Virtual backgrounds use your device&apos;s processing power. Performance may vary.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
