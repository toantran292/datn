'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Mic, Image, Check, Upload, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';

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
  const [activeTab, setActiveTab] = useState<'devices' | 'background' | 'appearance'>('devices');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  const [customBackgrounds, setCustomBackgrounds] = useState<BackgroundOption[]>([]);

  // Get available devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // First try to enumerate devices without requesting new stream
        // This works if permission was already granted
        let devices = await navigator.mediaDevices.enumerateDevices();

        // Check if we have labels (indicates permission was granted)
        const hasLabels = devices.some(d => d.label && d.label.length > 0);

        if (!hasLabels) {
          // Need to request permission - but only request what we need
          // and release immediately to avoid conflicts with Jitsi
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            // Stop all tracks immediately to release the devices
            stream.getTracks().forEach(track => track.stop());
            // Re-enumerate after getting permission
            devices = await navigator.mediaDevices.enumerateDevices();
          } catch (permErr) {
            console.warn('[Settings] Could not get media permission:', permErr);
            // Still try to use devices without labels
          }
        }

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
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ts-text-primary)' }}>Settings</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--ts-text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--ts-border)' }}>
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'devices'
                  ? 'text-[var(--ts-orange)] border-b-2 border-[var(--ts-orange)]'
                  : 'text-[var(--ts-text-secondary)] hover:text-[var(--ts-text-primary)]'
              }`}
            >
              Devices
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'background'
                  ? 'text-[var(--ts-orange)] border-b-2 border-[var(--ts-orange)]'
                  : 'text-[var(--ts-text-secondary)] hover:text-[var(--ts-text-primary)]'
              }`}
            >
              Background
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'appearance'
                  ? 'text-[var(--ts-orange)] border-b-2 border-[var(--ts-orange)]'
                  : 'text-[var(--ts-text-secondary)] hover:text-[var(--ts-text-primary)]'
              }`}
            >
              Appearance
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'devices' && (
              <div className="space-y-6">
                {/* Camera Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--ts-text-primary)' }}>
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
                            : 'border border-transparent'
                        }`}
                        style={{
                          backgroundColor: selectedCamera === camera.deviceId ? undefined : 'var(--ts-input-bg)',
                        }}
                      >
                        <span className="text-sm truncate" style={{ color: 'var(--ts-text-primary)' }}>{camera.label}</span>
                        {selectedCamera === camera.deviceId && (
                          <Check className="w-4 h-4 text-ts-orange flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {cameras.length === 0 && (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--ts-text-secondary)' }}>No cameras found</p>
                    )}
                  </div>
                </div>

                {/* Microphone Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--ts-text-primary)' }}>
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
                            : 'border border-transparent'
                        }`}
                        style={{
                          backgroundColor: selectedMic === mic.deviceId ? undefined : 'var(--ts-input-bg)',
                        }}
                      >
                        <span className="text-sm truncate" style={{ color: 'var(--ts-text-primary)' }}>{mic.label}</span>
                        {selectedMic === mic.deviceId && (
                          <Check className="w-4 h-4 text-ts-teal flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {microphones.length === 0 && (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--ts-text-secondary)' }}>No microphones found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'background' && (
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: 'var(--ts-text-primary)' }}>
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
                        : ''
                    }`}
                    style={{ background: 'var(--ts-input-bg)', border: '1px solid var(--ts-border)' }}
                  >
                    <span className="text-xs" style={{ color: 'var(--ts-text-secondary)' }}>None</span>
                  </button>

                  {/* Blur option */}
                  <button
                    onClick={() => handleBackgroundChange({ type: 'blur', name: 'Blur' })}
                    className={`aspect-video rounded-xl flex items-center justify-center transition-all ${
                      selectedBackground.type === 'blur'
                        ? 'ring-2 ring-ts-orange'
                        : ''
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,136,0,0.3), rgba(0,196,171,0.3))',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <span className="text-xs" style={{ color: 'var(--ts-text-primary)' }}>Blur</span>
                  </button>

                  {/* Preset backgrounds */}
                  {PRESET_BACKGROUNDS.filter(bg => bg.type === 'image').map((bg, index) => (
                    <button
                      key={index}
                      onClick={() => handleBackgroundChange(bg)}
                      className={`aspect-video rounded-xl overflow-hidden transition-all relative ${
                        selectedBackground.value === bg.value
                          ? 'ring-2 ring-ts-orange'
                          : ''
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
                        <span className="text-[10px] text-white">{bg.name}</span>
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
                          : ''
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${bg.value})` }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-1">
                        <span className="text-[10px] text-white truncate px-1">{bg.name}</span>
                      </div>
                    </button>
                  ))}

                  {/* Upload button */}
                  <label
                    className="aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--ts-border)' }}
                  >
                    <Upload className="w-5 h-5 mb-1" style={{ color: 'var(--ts-text-secondary)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--ts-text-secondary)' }}>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <p className="text-xs text-[var(--ts-text-secondary)] mt-4">
                  Virtual backgrounds use your device&apos;s processing power. Performance may vary.
                </p>
              </div>
            )}

            {activeTab === 'appearance' && (
              /* Appearance Tab */
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--ts-text-primary)] mb-3">
                    <Palette className="w-4 h-4" />
                    Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Light Theme */}
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        mounted && theme === 'light'
                          ? 'bg-[var(--ts-orange)]/20 border border-[var(--ts-orange)]'
                          : 'bg-[var(--ts-input-bg)] border border-transparent hover:border-[var(--ts-border)]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <Sun className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[var(--ts-text-primary)]">Light</p>
                        <p className="text-xs text-[var(--ts-text-secondary)]">Bright mode</p>
                      </div>
                      {mounted && theme === 'light' && (
                        <Check className="w-4 h-4 text-[var(--ts-orange)] ml-auto" />
                      )}
                    </button>

                    {/* Dark Theme */}
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        mounted && theme === 'dark'
                          ? 'bg-[var(--ts-orange)]/20 border border-[var(--ts-orange)]'
                          : 'bg-[var(--ts-input-bg)] border border-transparent hover:border-[var(--ts-border)]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center">
                        <Moon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-[var(--ts-text-primary)]">Dark</p>
                        <p className="text-xs text-[var(--ts-text-secondary)]">Dark mode</p>
                      </div>
                      {mounted && theme === 'dark' && (
                        <Check className="w-4 h-4 text-[var(--ts-orange)] ml-auto" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[var(--ts-text-secondary)]">
                  Choose your preferred appearance for UTS Meet.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
