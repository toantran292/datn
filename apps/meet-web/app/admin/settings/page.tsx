'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Server,
  Video,
  HardDrive,
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface JitsiConfig {
  domain: string;
  websocketUrl: string;
  stunServers: string[];
  turnServers: string[];
  turnUsername: string;
  turnCredential: string;
}

interface JibriConfig {
  enabled: boolean;
  maxConcurrentRecordings: number;
  recordingPath: string;
  s3Enabled: boolean;
  s3Bucket: string;
  s3Region: string;
}

interface MeetingDefaults {
  maxParticipants: number;
  defaultMuted: boolean;
  defaultVideoOff: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  allowChat: boolean;
  lobbyEnabled: boolean;
  autoEndEmpty: boolean;
  autoEndEmptyTimeout: number;
}

export default function AdminSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'jitsi' | 'jibri' | 'meetings' | 'security'>('jitsi');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Jitsi Configuration
  const [jitsiConfig, setJitsiConfig] = useState<JitsiConfig>({
    domain: 'meet.example.com',
    websocketUrl: 'wss://meet.example.com/xmpp-websocket',
    stunServers: ['stun:stun.l.google.com:19302'],
    turnServers: ['turn:turn.example.com:443'],
    turnUsername: 'user',
    turnCredential: '********',
  });

  // Jibri Configuration
  const [jibriConfig, setJibriConfig] = useState<JibriConfig>({
    enabled: true,
    maxConcurrentRecordings: 3,
    recordingPath: '/recordings',
    s3Enabled: true,
    s3Bucket: 'meeting-recordings',
    s3Region: 'us-east-1',
  });

  // Meeting Defaults
  const [meetingDefaults, setMeetingDefaults] = useState<MeetingDefaults>({
    maxParticipants: 50,
    defaultMuted: true,
    defaultVideoOff: false,
    allowScreenShare: true,
    allowRecording: true,
    allowChat: true,
    lobbyEnabled: false,
    autoEndEmpty: true,
    autoEndEmptyTimeout: 300,
  });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'jitsi', label: 'Jitsi Config', icon: <Server className="w-4 h-4" /> },
    { id: 'jibri', label: 'Recording', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'meetings', label: 'Meeting Defaults', icon: <Video className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-800/30 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-white">System Settings</h1>
              <p className="text-sm text-gray-400">Configure Jitsi components</p>
            </div>

            <div className="flex items-center gap-3">
              {saveStatus === 'success' && (
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Error saving
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ts-orange to-ts-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-ts-teal/20 text-ts-teal border border-ts-teal/30'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          {/* Jitsi Config */}
          {activeTab === 'jitsi' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Jitsi Videobridge Configuration</h2>
                <p className="text-sm text-gray-400">Configure the core video conferencing server settings.</p>
              </div>

              <div className="grid gap-4">
                <InputField
                  label="Domain"
                  value={jitsiConfig.domain}
                  onChange={v => setJitsiConfig({ ...jitsiConfig, domain: v })}
                  placeholder="meet.example.com"
                />
                <InputField
                  label="WebSocket URL"
                  value={jitsiConfig.websocketUrl}
                  onChange={v => setJitsiConfig({ ...jitsiConfig, websocketUrl: v })}
                  placeholder="wss://meet.example.com/xmpp-websocket"
                />

                <div className="border-t border-gray-700 pt-4 mt-2">
                  <h3 className="text-sm font-medium text-white mb-3">ICE Servers</h3>

                  <div className="space-y-3">
                    <InputField
                      label="STUN Servers"
                      value={jitsiConfig.stunServers.join(', ')}
                      onChange={v => setJitsiConfig({ ...jitsiConfig, stunServers: v.split(', ') })}
                      placeholder="stun:stun.example.com:19302"
                      hint="Comma separated list"
                    />
                    <InputField
                      label="TURN Servers"
                      value={jitsiConfig.turnServers.join(', ')}
                      onChange={v => setJitsiConfig({ ...jitsiConfig, turnServers: v.split(', ') })}
                      placeholder="turn:turn.example.com:443"
                      hint="Comma separated list"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="TURN Username"
                        value={jitsiConfig.turnUsername}
                        onChange={v => setJitsiConfig({ ...jitsiConfig, turnUsername: v })}
                      />
                      <InputField
                        label="TURN Credential"
                        value={jitsiConfig.turnCredential}
                        onChange={v => setJitsiConfig({ ...jitsiConfig, turnCredential: v })}
                        type="password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Jibri Config */}
          {activeTab === 'jibri' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Recording Configuration</h2>
                <p className="text-sm text-gray-400">Configure Jibri recording service settings.</p>
              </div>

              <div className="space-y-4">
                <ToggleField
                  label="Enable Recording"
                  description="Allow meetings to be recorded"
                  checked={jibriConfig.enabled}
                  onChange={v => setJibriConfig({ ...jibriConfig, enabled: v })}
                />

                {jibriConfig.enabled && (
                  <>
                    <InputField
                      label="Max Concurrent Recordings"
                      value={jibriConfig.maxConcurrentRecordings.toString()}
                      onChange={v => setJibriConfig({ ...jibriConfig, maxConcurrentRecordings: parseInt(v) || 1 })}
                      type="number"
                    />
                    <InputField
                      label="Recording Path"
                      value={jibriConfig.recordingPath}
                      onChange={v => setJibriConfig({ ...jibriConfig, recordingPath: v })}
                      placeholder="/recordings"
                    />

                    <div className="border-t border-gray-700 pt-4 mt-2">
                      <ToggleField
                        label="S3 Storage"
                        description="Upload recordings to Amazon S3"
                        checked={jibriConfig.s3Enabled}
                        onChange={v => setJibriConfig({ ...jibriConfig, s3Enabled: v })}
                      />

                      {jibriConfig.s3Enabled && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <InputField
                            label="S3 Bucket"
                            value={jibriConfig.s3Bucket}
                            onChange={v => setJibriConfig({ ...jibriConfig, s3Bucket: v })}
                          />
                          <InputField
                            label="S3 Region"
                            value={jibriConfig.s3Region}
                            onChange={v => setJibriConfig({ ...jibriConfig, s3Region: v })}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Meeting Defaults */}
          {activeTab === 'meetings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Default Meeting Settings</h2>
                <p className="text-sm text-gray-400">Configure default settings for new meetings.</p>
              </div>

              <div className="space-y-4">
                <InputField
                  label="Max Participants"
                  value={meetingDefaults.maxParticipants.toString()}
                  onChange={v => setMeetingDefaults({ ...meetingDefaults, maxParticipants: parseInt(v) || 10 })}
                  type="number"
                  hint="Maximum participants per meeting"
                />

                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-white mb-3">Default States</h3>
                  <div className="space-y-3">
                    <ToggleField
                      label="Mute on Join"
                      description="Participants join with mic muted"
                      checked={meetingDefaults.defaultMuted}
                      onChange={v => setMeetingDefaults({ ...meetingDefaults, defaultMuted: v })}
                    />
                    <ToggleField
                      label="Video Off on Join"
                      description="Participants join with camera off"
                      checked={meetingDefaults.defaultVideoOff}
                      onChange={v => setMeetingDefaults({ ...meetingDefaults, defaultVideoOff: v })}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-white mb-3">Features</h3>
                  <div className="space-y-3">
                    <ToggleField
                      label="Allow Screen Share"
                      description="Enable screen sharing in meetings"
                      checked={meetingDefaults.allowScreenShare}
                      onChange={v => setMeetingDefaults({ ...meetingDefaults, allowScreenShare: v })}
                    />
                    <ToggleField
                      label="Allow Recording"
                      description="Enable recording feature"
                      checked={meetingDefaults.allowRecording}
                      onChange={v => setMeetingDefaults({ ...meetingDefaults, allowRecording: v })}
                    />
                    <ToggleField
                      label="Enable Lobby"
                      description="Require host approval to join"
                      checked={meetingDefaults.lobbyEnabled}
                      onChange={v => setMeetingDefaults({ ...meetingDefaults, lobbyEnabled: v })}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-white mb-3">Auto-end Settings</h3>
                  <ToggleField
                    label="Auto-end Empty Meetings"
                    description="Automatically end meetings when empty"
                    checked={meetingDefaults.autoEndEmpty}
                    onChange={v => setMeetingDefaults({ ...meetingDefaults, autoEndEmpty: v })}
                  />
                  {meetingDefaults.autoEndEmpty && (
                    <div className="mt-3">
                      <InputField
                        label="Timeout (seconds)"
                        value={meetingDefaults.autoEndEmptyTimeout.toString()}
                        onChange={v => setMeetingDefaults({ ...meetingDefaults, autoEndEmptyTimeout: parseInt(v) || 60 })}
                        type="number"
                        hint="Time to wait before ending empty meeting"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Security Settings</h2>
                <p className="text-sm text-gray-400">Configure security and access control settings.</p>
              </div>

              <div className="space-y-4">
                <ToggleField
                  label="Require Authentication"
                  description="Users must be logged in to join meetings"
                  checked={true}
                  onChange={() => {}}
                />
                <ToggleField
                  label="JWT Token Validation"
                  description="Validate JWT tokens for all meeting joins"
                  checked={true}
                  onChange={() => {}}
                />
                <ToggleField
                  label="End-to-End Encryption"
                  description="Enable E2EE for all meetings (experimental)"
                  checked={false}
                  onChange={() => {}}
                />

                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-white mb-3">Rate Limiting</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Max Meetings/User/Hour"
                      value="10"
                      onChange={() => {}}
                      type="number"
                    />
                    <InputField
                      label="Max Recordings/User/Day"
                      value="5"
                      onChange={() => {}}
                      type="number"
                    />
                  </div>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-500">Security Notice</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Changing security settings may affect active meetings. It&apos;s recommended to apply changes during off-peak hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Input Field Component
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ts-teal/50 focus:border-ts-teal transition-colors"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

// Toggle Field Component
function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-ts-teal' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
