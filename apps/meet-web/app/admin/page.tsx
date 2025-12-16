'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Video,
  Server,
  Activity,
  HardDrive,
  Cpu,
  Wifi,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
} from 'lucide-react';

// Mock data for demo - replace with real API calls
interface SystemStats {
  activeMeetings: number;
  totalParticipants: number;
  totalRecordings: number;
  storageUsed: string;
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  jitsiStatus: 'healthy' | 'degraded' | 'down';
  jibriStatus: 'available' | 'busy' | 'offline';
  prosodyStatus: 'running' | 'stopped';
}

interface ActiveMeeting {
  id: string;
  roomId: string;
  participantCount: number;
  duration: number;
  isRecording: boolean;
  startedAt: string;
}

interface RecentEvent {
  id: string;
  type: 'meeting_started' | 'meeting_ended' | 'recording_started' | 'error' | 'warning';
  message: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats>({
    activeMeetings: 3,
    totalParticipants: 12,
    totalRecordings: 45,
    storageUsed: '125.4 GB',
    cpuUsage: 35,
    memoryUsage: 62,
    networkLatency: 24,
    jitsiStatus: 'healthy',
    jibriStatus: 'available',
    prosodyStatus: 'running',
  });

  const [activeMeetings, setActiveMeetings] = useState<ActiveMeeting[]>([
    {
      id: '1',
      roomId: 'project-abc-123',
      participantCount: 5,
      duration: 1234,
      isRecording: true,
      startedAt: new Date(Date.now() - 1234000).toISOString(),
    },
    {
      id: '2',
      roomId: 'chat-xyz-456',
      participantCount: 3,
      duration: 567,
      isRecording: false,
      startedAt: new Date(Date.now() - 567000).toISOString(),
    },
    {
      id: '3',
      roomId: 'project-def-789',
      participantCount: 4,
      duration: 890,
      isRecording: false,
      startedAt: new Date(Date.now() - 890000).toISOString(),
    },
  ]);

  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([
    { id: '1', type: 'meeting_started', message: 'Meeting started in room project-abc-123', timestamp: new Date(Date.now() - 60000).toISOString() },
    { id: '2', type: 'recording_started', message: 'Recording started for project-abc-123', timestamp: new Date(Date.now() - 120000).toISOString() },
    { id: '3', type: 'meeting_ended', message: 'Meeting ended in room chat-old-111', timestamp: new Date(Date.now() - 300000).toISOString() },
    { id: '4', type: 'warning', message: 'High CPU usage detected on Jibri node', timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: '5', type: 'meeting_started', message: 'Meeting started in room chat-xyz-456', timestamp: new Date(Date.now() - 900000).toISOString() },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting_started':
        return <Video className="w-4 h-4 text-green-500" />;
      case 'meeting_ended':
        return <Video className="w-4 h-4 text-gray-500" />;
      case 'recording_started':
        return <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-800/30 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-gray-400">System overview and monitoring</p>
            </div>

            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Video className="w-6 h-6" />}
            label="Active Meetings"
            value={stats.activeMeetings.toString()}
            trend="+2 from last hour"
            color="orange"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Participants"
            value={stats.totalParticipants.toString()}
            trend="Currently online"
            color="teal"
          />
          <StatCard
            icon={<Database className="w-6 h-6" />}
            label="Total Recordings"
            value={stats.totalRecordings.toString()}
            trend={stats.storageUsed + ' used'}
            color="purple"
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            label="Network Latency"
            value={stats.networkLatency + 'ms'}
            trend="Avg response time"
            color="blue"
          />
        </div>

        {/* Infrastructure Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* System Resources */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-400" />
              System Resources
            </h2>

            <div className="space-y-4">
              <ResourceBar label="CPU Usage" value={stats.cpuUsage} icon={<Cpu className="w-4 h-4" />} />
              <ResourceBar label="Memory Usage" value={stats.memoryUsage} icon={<HardDrive className="w-4 h-4" />} />
              <ResourceBar label="Network" value={100 - stats.networkLatency} icon={<Wifi className="w-4 h-4" />} />
            </div>
          </div>

          {/* Service Status */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              Service Status
            </h2>

            <div className="space-y-3">
              <ServiceStatus
                name="Jitsi Videobridge"
                status={stats.jitsiStatus}
                description="Video conferencing server"
              />
              <ServiceStatus
                name="Jibri Recorder"
                status={stats.jibriStatus}
                description="Recording service"
              />
              <ServiceStatus
                name="Prosody XMPP"
                status={stats.prosodyStatus}
                description="Messaging server"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-gray-400" />
              Quick Actions
            </h2>

            <div className="space-y-3">
              <QuickAction
                label="View All Meetings"
                description="Monitor active sessions"
                onClick={() => router.push('/admin/meetings')}
              />
              <QuickAction
                label="Manage Recordings"
                description="View and manage recordings"
                onClick={() => router.push('/admin/recordings')}
              />
              <QuickAction
                label="System Settings"
                description="Configure Jitsi components"
                onClick={() => router.push('/admin/settings')}
              />
              <QuickAction
                label="View Logs"
                description="System event logs"
                onClick={() => router.push('/admin/logs')}
              />
            </div>
          </div>
        </div>

        {/* Active Meetings & Recent Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Meetings */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-gray-400" />
                Active Meetings
              </h2>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                {activeMeetings.length} live
              </span>
            </div>

            <div className="space-y-3">
              {activeMeetings.map(meeting => (
                <div
                  key={meeting.id}
                  className="p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/meetings/${meeting.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white text-sm truncate max-w-[200px]">
                      {meeting.roomId}
                    </span>
                    {meeting.isRecording && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        REC
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {meeting.participantCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(meeting.duration)}
                    </span>
                  </div>
                </div>
              ))}

              {activeMeetings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No active meetings</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-400" />
                Recent Events
              </h2>
              <button className="text-xs text-ts-teal hover:underline">
                View all
              </button>
            </div>

            <div className="space-y-3">
              {recentEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="mt-0.5">{getEventIcon(event.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{event.message}</p>
                    <p className="text-xs text-gray-500">{formatTime(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  color: 'orange' | 'teal' | 'purple' | 'blue';
}) {
  const colorClasses = {
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    teal: 'from-teal-500/20 to-teal-600/10 border-teal-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  };

  const iconColors = {
    orange: 'text-orange-500',
    teal: 'text-teal-500',
    purple: 'text-purple-500',
    blue: 'text-blue-500',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-2xl border p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className={iconColors[color]}>{icon}</span>
        <TrendingUp className="w-4 h-4 text-gray-500" />
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{trend}</p>
    </div>
  );
}

// Resource Bar Component
function ResourceBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  const getColor = (v: number) => {
    if (v < 50) return 'bg-green-500';
    if (v < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-400 flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="text-sm font-medium text-white">{value}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Service Status Component
function ServiceStatus({
  name,
  status,
  description,
}: {
  name: string;
  status: string;
  description: string;
}) {
  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'healthy':
      case 'available':
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
      case 'busy':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
      <div className="flex items-center gap-3">
        {getStatusIcon(status)}
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
        status === 'healthy' || status === 'available' || status === 'running'
          ? 'bg-green-500/20 text-green-400'
          : status === 'degraded' || status === 'busy'
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-red-500/20 text-red-400'
      }`}>
        {status}
      </span>
    </div>
  );
}

// Quick Action Component
function QuickAction({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-left transition-colors group"
    >
      <p className="text-sm font-medium text-white group-hover:text-ts-teal transition-colors">
        {label}
      </p>
      <p className="text-xs text-gray-500">{description}</p>
    </button>
  );
}
