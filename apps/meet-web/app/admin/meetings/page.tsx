'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Users,
  Clock,
  Search,
  RefreshCw,
  Eye,
  PhoneOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  Circle,
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  joinedAt: string;
}

interface ActiveMeeting {
  id: string;
  roomId: string;
  subjectType: 'chat' | 'project';
  subjectId: string;
  hostName: string;
  participants: Participant[];
  isRecording: boolean;
  isLocked: boolean;
  startedAt: string;
  duration: number;
}

export default function AdminMeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<ActiveMeeting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<ActiveMeeting | null>(null);
  const [filter, setFilter] = useState<'all' | 'recording' | 'large'>('all');

  // Mock data - replace with real API
  useEffect(() => {
    const mockMeetings: ActiveMeeting[] = [
      {
        id: '1',
        roomId: 'project-design-review-123',
        subjectType: 'project',
        subjectId: 'proj-123',
        hostName: 'John Doe',
        participants: [
          { id: 'p1', name: 'John Doe', isMuted: false, isVideoOn: true, isScreenSharing: true, joinedAt: new Date(Date.now() - 1800000).toISOString() },
          { id: 'p2', name: 'Jane Smith', isMuted: true, isVideoOn: true, isScreenSharing: false, joinedAt: new Date(Date.now() - 1700000).toISOString() },
          { id: 'p3', name: 'Bob Wilson', isMuted: true, isVideoOn: false, isScreenSharing: false, joinedAt: new Date(Date.now() - 1600000).toISOString() },
          { id: 'p4', name: 'Alice Brown', isMuted: false, isVideoOn: true, isScreenSharing: false, joinedAt: new Date(Date.now() - 1500000).toISOString() },
          { id: 'p5', name: 'Charlie Davis', isMuted: true, isVideoOn: true, isScreenSharing: false, joinedAt: new Date(Date.now() - 900000).toISOString() },
        ],
        isRecording: true,
        isLocked: false,
        startedAt: new Date(Date.now() - 1800000).toISOString(),
        duration: 1800,
      },
      {
        id: '2',
        roomId: 'chat-team-standup-456',
        subjectType: 'chat',
        subjectId: 'chat-456',
        hostName: 'Sarah Johnson',
        participants: [
          { id: 'p6', name: 'Sarah Johnson', isMuted: false, isVideoOn: true, isScreenSharing: false, joinedAt: new Date(Date.now() - 900000).toISOString() },
          { id: 'p7', name: 'Mike Lee', isMuted: true, isVideoOn: true, isScreenSharing: false, joinedAt: new Date(Date.now() - 850000).toISOString() },
          { id: 'p8', name: 'Emily Chen', isMuted: false, isVideoOn: false, isScreenSharing: false, joinedAt: new Date(Date.now() - 800000).toISOString() },
        ],
        isRecording: false,
        isLocked: false,
        startedAt: new Date(Date.now() - 900000).toISOString(),
        duration: 900,
      },
      {
        id: '3',
        roomId: 'project-sprint-planning-789',
        subjectType: 'project',
        subjectId: 'proj-789',
        hostName: 'David Kim',
        participants: [
          { id: 'p9', name: 'David Kim', isMuted: false, isVideoOn: true, isScreenSharing: false, joinedAt: new Date(Date.now() - 600000).toISOString() },
          { id: 'p10', name: 'Lisa Wang', isMuted: true, isVideoOn: true, isScreenSharing: false, joinedAt: new Date(Date.now() - 550000).toISOString() },
        ],
        isRecording: false,
        isLocked: true,
        startedAt: new Date(Date.now() - 600000).toISOString(),
        duration: 600,
      },
    ];
    setMeetings(mockMeetings);
  }, []);

  // Auto-refresh duration every second
  useEffect(() => {
    const interval = setInterval(() => {
      setMeetings(prev =>
        prev.map(m => ({
          ...m,
          duration: m.duration + 1,
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleEndMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to end this meeting? All participants will be disconnected.')) return;

    // API call to end meeting
    setMeetings(prev => prev.filter(m => m.id !== meetingId));
    setSelectedMeeting(null);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch =
      m.roomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hostName.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'recording') return matchesSearch && m.isRecording;
    if (filter === 'large') return matchesSearch && m.participants.length >= 5;
    return matchesSearch;
  });

  const totalParticipants = meetings.reduce((sum, m) => sum + m.participants.length, 0);
  const recordingCount = meetings.filter(m => m.isRecording).length;

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-800/30 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-white">Active Meetings</h1>
              <p className="text-sm text-gray-400">Real-time monitoring</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">
                  <span className="text-white font-medium">{meetings.length}</span> meetings
                </span>
                <span className="text-gray-400">
                  <span className="text-white font-medium">{totalParticipants}</span> participants
                </span>
                {recordingCount > 0 && (
                  <span className="flex items-center gap-1 text-red-400">
                    <Circle className="w-2 h-2 fill-current animate-pulse" />
                    {recordingCount} recording
                  </span>
                )}
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by room ID or host name..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ts-teal/50 focus:border-ts-teal"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'recording', 'large'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-ts-teal/20 text-ts-teal border border-ts-teal/30'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
              >
                {f === 'all' ? 'All' : f === 'recording' ? 'Recording' : '5+ Users'}
              </button>
            ))}
          </div>
        </div>

        {/* Meetings Grid */}
        <div className="grid gap-4">
          {filteredMeetings.map(meeting => (
            <div
              key={meeting.id}
              className={`bg-gray-800/50 backdrop-blur-sm rounded-2xl border transition-colors ${
                selectedMeeting?.id === meeting.id
                  ? 'border-ts-teal'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Meeting Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setSelectedMeeting(selectedMeeting?.id === meeting.id ? null : meeting)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      meeting.subjectType === 'project'
                        ? 'bg-orange-500/20'
                        : 'bg-teal-500/20'
                    }`}>
                      <Video className={`w-5 h-5 ${
                        meeting.subjectType === 'project' ? 'text-orange-500' : 'text-teal-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{meeting.roomId}</h3>
                        {meeting.isLocked && (
                          <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                            Locked
                          </span>
                        )}
                        {meeting.isRecording && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                            <Circle className="w-2 h-2 fill-current animate-pulse" />
                            REC
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Host: {meeting.hostName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Users className="w-4 h-4" />
                        {meeting.participants.length}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        {formatDuration(meeting.duration)}
                      </span>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleEndMeeting(meeting.id);
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="End Meeting"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Participants */}
              {selectedMeeting?.id === meeting.id && (
                <div className="border-t border-gray-700 p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Participants</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {meeting.participants.map(participant => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ts-orange to-ts-teal flex items-center justify-center text-white text-sm font-medium">
                            {participant.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {participant.name}
                              {participant.name === meeting.hostName && (
                                <span className="ml-1 text-xs text-ts-orange">(Host)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              Joined {new Date(participant.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {participant.isScreenSharing && (
                            <Monitor className="w-4 h-4 text-ts-teal" />
                          )}
                          {participant.isMuted ? (
                            <MicOff className="w-4 h-4 text-red-400" />
                          ) : (
                            <Mic className="w-4 h-4 text-green-400" />
                          )}
                          {participant.isVideoOn ? (
                            <Camera className="w-4 h-4 text-green-400" />
                          ) : (
                            <CameraOff className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => router.push(`/meet/${meeting.roomId}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Join as Observer
                    </button>
                    <button
                      onClick={() => handleEndMeeting(meeting.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                    >
                      <PhoneOff className="w-4 h-4" />
                      End Meeting
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredMeetings.length === 0 && (
            <div className="text-center py-16">
              <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No active meetings</h3>
              <p className="text-gray-500">
                {searchQuery ? 'No meetings match your search' : 'All meetings have ended'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
