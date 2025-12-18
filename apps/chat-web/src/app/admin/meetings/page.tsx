'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@uts/design-system/ui';
import { adminApi, AdminMeeting, AdminMeetingDetail } from '@/lib/admin-api';
import {
  Video,
  Users,
  Clock,
  X,
  RefreshCw,
  Search,
  AlertTriangle,
  Eye,
  UserX,
  Power,
  Loader2,
  Shield,
} from 'lucide-react';

type MeetingStatus = 'ACTIVE' | 'ENDED' | 'ALL';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export default function AdminMeetingsPage() {
  const { userProfile } = useProfile();
  const [meetings, setMeetings] = useState<AdminMeeting[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<MeetingStatus>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<AdminMeetingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const userId = userProfile?.userId || '';

  const loadMeetings = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.listMeetings(userId, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery || undefined,
        limit: 50,
      });
      setMeetings(response.meetings);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [userId, statusFilter, searchQuery]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  // Auto-refresh active meetings every 10 seconds
  useEffect(() => {
    if (statusFilter === 'ACTIVE') {
      const interval = setInterval(loadMeetings, 10000);
      return () => clearInterval(interval);
    }
  }, [statusFilter, loadMeetings]);

  const handleViewDetail = async (meetingId: string) => {
    if (!userId) return;

    setDetailLoading(true);
    try {
      const response = await adminApi.getMeetingDetail(userId, meetingId);
      setSelectedMeeting(response.meeting);
    } catch (err: any) {
      setError(err.message || 'Failed to load meeting details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTerminate = async (meetingId: string) => {
    if (!userId) return;
    if (!confirm('Are you sure you want to terminate this meeting? All participants will be disconnected.')) {
      return;
    }

    setActionLoading(meetingId);
    try {
      await adminApi.terminateMeeting(userId, meetingId, 'Terminated by system admin');
      loadMeetings();
      if (selectedMeeting?.id === meetingId) {
        setSelectedMeeting(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to terminate meeting');
    } finally {
      setActionLoading(null);
    }
  };

  const handleKickParticipant = async (meetingId: string, targetUserId: string, userName: string) => {
    if (!userId) return;
    if (!confirm(`Are you sure you want to kick ${userName || targetUserId} from this meeting?`)) {
      return;
    }

    setActionLoading(`kick-${targetUserId}`);
    try {
      await adminApi.kickParticipant(userId, meetingId, targetUserId, 'Kicked by system admin');
      // Refresh meeting detail
      handleViewDetail(meetingId);
    } catch (err: any) {
      alert(err.message || 'Failed to kick participant');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</span>;
      case 'ENDED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Ended</span>;
      case 'TERMINATED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Terminated</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{status}</span>;
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-custom-background-100">
        <div className="text-center">
          <Shield size={48} className="mx-auto mb-4 text-custom-text-300" />
          <h2 className="text-xl font-semibold text-custom-text-100 mb-2">Authentication Required</h2>
          <p className="text-custom-text-300">Please log in to access admin features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-background-100">
      {/* Header */}
      <div className="bg-custom-background-90 border-b border-custom-border-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Video size={20} className="text-teal-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-custom-text-100">Meeting Administration</h1>
              <p className="text-sm text-custom-text-300">Manage all active meetings across the platform</p>
            </div>
          </div>

          <button
            onClick={loadMeetings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-custom-background-80 hover:bg-custom-background-90 text-custom-text-200 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-custom-border-200 bg-custom-background-100">
        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            {(['ACTIVE', 'ENDED', 'ALL'] as MeetingStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-teal-500 text-white'
                    : 'bg-custom-background-80 text-custom-text-200 hover:bg-custom-background-90'
                }`}
              >
                {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-custom-text-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by room ID..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-custom-background-80 border border-custom-border-200 text-custom-text-100 placeholder-custom-text-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="text-sm text-custom-text-300">
            {total} meeting{total !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading && meetings.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-teal-500" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12">
            <Video size={48} className="mx-auto mb-4 text-custom-text-300" />
            <h3 className="text-lg font-medium text-custom-text-100 mb-2">No meetings found</h3>
            <p className="text-custom-text-300">
              {statusFilter === 'ACTIVE'
                ? 'There are no active meetings at the moment.'
                : 'No meetings match your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-custom-border-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-custom-text-300">Room</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-custom-text-300">Host</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-custom-text-300">Participants</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-custom-text-300">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-custom-text-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-custom-text-300">Started</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-custom-text-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting) => (
                  <tr
                    key={meeting.id}
                    className="border-b border-custom-border-200 hover:bg-custom-background-80 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-custom-text-100 truncate max-w-[200px]" title={meeting.roomId}>
                        {meeting.roomId.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-custom-text-300">{meeting.subjectType}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-custom-text-200">{meeting.hostName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-custom-text-200">
                        <Users size={14} />
                        {meeting.participantCount}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-custom-text-200">
                        <Clock size={14} />
                        {formatDuration(meeting.duration)}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(meeting.status)}</td>
                    <td className="py-3 px-4 text-sm text-custom-text-300">{formatDate(meeting.startedAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetail(meeting.id)}
                          className="p-2 rounded-lg hover:bg-custom-background-90 text-custom-text-300 hover:text-custom-text-100 transition-colors"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        {meeting.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleTerminate(meeting.id)}
                            disabled={actionLoading === meeting.id}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors disabled:opacity-50"
                            title="Terminate meeting"
                          >
                            {actionLoading === meeting.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Power size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-custom-background-100 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-custom-border-200">
              <div>
                <h2 className="text-lg font-semibold text-custom-text-100">Meeting Details</h2>
                <p className="text-sm text-custom-text-300 truncate max-w-[400px]">{selectedMeeting.roomId}</p>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-2 rounded-lg hover:bg-custom-background-80 text-custom-text-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={32} className="animate-spin text-teal-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-custom-background-80">
                      <div className="text-sm text-custom-text-300 mb-1">Status</div>
                      {getStatusBadge(selectedMeeting.status)}
                    </div>
                    <div className="p-4 rounded-lg bg-custom-background-80">
                      <div className="text-sm text-custom-text-300 mb-1">Duration</div>
                      <div className="font-medium text-custom-text-100">{formatDuration(selectedMeeting.duration)}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-custom-background-80">
                      <div className="text-sm text-custom-text-300 mb-1">Started At</div>
                      <div className="text-sm text-custom-text-100">{formatDate(selectedMeeting.startedAt)}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-custom-background-80">
                      <div className="text-sm text-custom-text-300 mb-1">Type</div>
                      <div className="font-medium text-custom-text-100 capitalize">{selectedMeeting.subjectType}</div>
                    </div>
                  </div>

                  {/* Participants */}
                  <div>
                    <h3 className="font-medium text-custom-text-100 mb-3 flex items-center gap-2">
                      <Users size={16} />
                      Participants ({selectedMeeting.participants.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedMeeting.participants.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-custom-background-80"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-teal-500">
                                {(p.userName || 'U')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-custom-text-100">{p.userName || 'Unknown'}</div>
                              <div className="text-xs text-custom-text-300">
                                {p.role} | {p.status}
                              </div>
                            </div>
                          </div>
                          {p.status === 'JOINED' && selectedMeeting.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleKickParticipant(selectedMeeting.id, p.userId, p.userName || '')}
                              disabled={actionLoading === `kick-${p.userId}`}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors disabled:opacity-50"
                              title="Kick participant"
                            >
                              {actionLoading === `kick-${p.userId}` ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserX size={14} />
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedMeeting.status === 'ACTIVE' && (
              <div className="px-6 py-4 border-t border-custom-border-200 bg-custom-background-80">
                <button
                  onClick={() => handleTerminate(selectedMeeting.id)}
                  disabled={actionLoading === selectedMeeting.id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === selectedMeeting.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Power size={16} />
                  )}
                  Terminate Meeting
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
