'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserSessions, getMeetingToken, MeetingSession } from '@/lib/api';
import {
  Video,
  Users,
  Clock,
  Calendar,
  Play,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Mic,
  FileVideo,
  Loader2,
} from 'lucide-react';

type StatusFilter = 'all' | 'ACTIVE' | 'ENDED' | 'WAITING';

export default function MeetingsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoining, setIsJoining] = useState<string | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId') || '';
    const storedName = localStorage.getItem('name') || '';
    setUserId(storedUserId);
    setUserName(storedName);
  }, []);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await getUserSessions(userId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 50,
      });
      setSessions(response.sessions);
    } catch (e: any) {
      setError(e.message || 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  }, [userId, statusFilter]);

  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId, fetchSessions]);

  // Join active meeting
  const handleJoinMeeting = async (session: MeetingSession) => {
    if (session.status !== 'ACTIVE') return;

    setIsJoining(session.meeting_id);
    try {
      const response = await getMeetingToken({
        user_id: userId,
        user_name: userName,
        subject_type: session.subject_type as 'chat' | 'project',
        chat_id: session.subject_type === 'chat' ? session.subject_id : undefined,
        project_id: session.subject_type === 'project' ? session.subject_id : undefined,
        room_id: session.room_id,
      });

      localStorage.setItem('meetingId', response.meeting_id);
      localStorage.setItem('roomId', response.room_id);
      localStorage.setItem('jwtToken', response.token);
      localStorage.setItem('websocketUrl', response.websocket_url);
      localStorage.setItem('iceServers', JSON.stringify(response.ice_servers));

      router.push(`/meet/${response.room_id}`);
    } catch (e: any) {
      setError(e.message || 'Failed to join meeting');
      setIsJoining(null);
    }
  };

  // View meeting details/replay
  const handleViewMeeting = (session: MeetingSession) => {
    router.push(`/meetings/${session.meeting_id}`);
  };

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        );
      case 'WAITING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            Waiting
          </span>
        );
      case 'ENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Ended
          </span>
        );
      default:
        return null;
    }
  };

  // Filter sessions by search
  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.room_id.toLowerCase().includes(query) ||
      session.subject_id.toLowerCase().includes(query) ||
      session.participants.some((p) => p.userName.toLowerCase().includes(query))
    );
  });

  // UTS Logo
  const UTSLogo = () => (
    <div className="w-10 h-10 bg-gradient-to-br from-ts-orange to-ts-teal rounded-xl flex items-center justify-center shadow-lg">
      <Video className="w-5 h-5 text-white" />
    </div>
  );

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-orange-50 to-teal-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please set your user ID first</p>
          <button
            onClick={() => router.push('/join')}
            className="px-6 py-3 bg-gradient-to-r from-ts-orange to-ts-teal text-white rounded-xl font-medium"
          >
            Go to Join Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-teal-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <UTSLogo />
              <div>
                <h1 className="text-xl font-bold text-gray-900">UTS Meet</h1>
                <p className="text-xs text-gray-500">Meetings</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName || userId}</p>
                <p className="text-xs text-gray-500">User ID: {userId}</p>
              </div>
              <button
                onClick={() => router.push('/join')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-ts-orange to-ts-teal text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                New Meeting
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search meetings by room, subject, or participant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ts-teal/25 focus:border-ts-teal transition-all bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ts-teal/25 focus:border-ts-teal transition-all bg-white"
            >
              <option value="all">All Meetings</option>
              <option value="ACTIVE">Live Now</option>
              <option value="WAITING">Waiting</option>
              <option value="ENDED">Ended</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-ts-orange animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading meetings...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSessions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No meetings found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : "You haven't joined any meetings yet"}
            </p>
            <button
              onClick={() => router.push('/join')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-ts-orange to-ts-teal text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Start a Meeting
            </button>
          </div>
        )}

        {/* Meetings Grid */}
        {!isLoading && filteredSessions.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSessions.map((session) => (
              <div
                key={session.meeting_id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-ts-orange/10 to-ts-teal/10 rounded-xl flex items-center justify-center">
                        <Video className="w-5 h-5 text-ts-orange" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {session.subject_type === 'chat' ? 'Chat Meeting' : 'Project Meeting'}
                        </p>
                        <p className="text-xs text-gray-500">{session.room_id}</p>
                      </div>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>

                  {/* Subject Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                      {session.subject_type}
                    </span>
                    <span className="truncate">{session.subject_id}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Time */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(session.started_at)}</span>
                    </div>
                    {session.duration && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(session.duration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div className="flex -space-x-2">
                      {session.participants.slice(0, 4).map((p, idx) => (
                        <div
                          key={idx}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-ts-orange to-ts-teal flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                          title={p.userName}
                        >
                          {p.userName.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {session.participants.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                          +{session.participants.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {session.participants.length} participant{session.participants.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Recording indicator */}
                  {session.recordings && session.recordings.length > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <FileVideo className="w-4 h-4 text-red-500" />
                      <span>{session.recordings.length} recording{session.recordings.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Host badge */}
                  {session.is_host && (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-ts-orange/10 text-ts-orange rounded text-xs font-medium">
                        Host
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="p-4 pt-0">
                  {session.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleJoinMeeting(session)}
                      disabled={isJoining === session.meeting_id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isJoining === session.meeting_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Join Now
                    </button>
                  ) : (
                    <button
                      onClick={() => handleViewMeeting(session)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all group-hover:bg-ts-teal/10 group-hover:text-ts-teal"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination info */}
        {!isLoading && filteredSessions.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {filteredSessions.length} meeting{filteredSessions.length !== 1 ? 's' : ''}
          </div>
        )}
      </main>
    </div>
  );
}
