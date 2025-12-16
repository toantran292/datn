'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSessionDetail, GetSessionDetailResponse } from '@/lib/api';
import {
  Video,
  Users,
  Clock,
  Calendar,
  ArrowLeft,
  Play,
  Download,
  FileVideo,
  User,
  Crown,
  Loader2,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.meetingId as string;

  const [session, setSession] = useState<GetSessionDetailResponse['session']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSession() {
      if (!meetingId) return;

      setIsLoading(true);
      setError('');

      try {
        const response = await getSessionDetail(meetingId);
        setSession(response.session);
      } catch (e: any) {
        setError(e.message || 'Failed to load meeting details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, [meetingId]);

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Format date
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        );
      case 'WAITING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            Waiting
          </span>
        );
      case 'ENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
            Ended
          </span>
        );
      default:
        return null;
    }
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    if (role === 'HOST' || role === 'MODERATOR') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-ts-orange/10 text-ts-orange">
          <Crown className="w-3 h-3" />
          Host
        </span>
      );
    }
    return null;
  };

  // Get participant status
  const getParticipantStatus = (status?: string, leftAt?: string) => {
    if (leftAt) {
      return <span className="text-xs text-gray-400">Left</span>;
    }
    if (status === 'JOINED') {
      return <span className="text-xs text-green-500">In meeting</span>;
    }
    if (status === 'KICKED') {
      return <span className="text-xs text-red-500">Kicked</span>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-orange-50/30 to-teal-50/30">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-ts-orange animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-orange-50/30 to-teal-50/30">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Meeting Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This meeting does not exist or has been deleted.'}</p>
          <button
            onClick={() => router.push('/meetings')}
            className="px-6 py-3 bg-gradient-to-r from-ts-orange to-ts-teal text-white rounded-xl font-medium"
          >
            Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-teal-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/meetings')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Meeting Details</h1>
            </div>
            {getStatusBadge(session.status)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Meeting Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-ts-orange to-ts-teal rounded-2xl flex items-center justify-center flex-shrink-0">
                <Video className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {session.subject_type === 'chat' ? 'Chat Meeting' : 'Project Meeting'}
                </h2>
                <p className="text-gray-500 font-mono text-sm mb-3">{session.room_id}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateTime(session.started_at)}</span>
                  </div>
                  {session.duration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(session.duration)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{session.participants.length} participants</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {session.locked ? (
                      <>
                        <Lock className="w-4 h-4 text-yellow-500" />
                        <span>Locked</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 text-green-500" />
                        <span>Open</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Info */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Subject</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-gray-200 rounded text-xs font-medium">
                    {session.subject_type}
                  </span>
                  <span className="font-medium text-gray-900">{session.subject_id}</span>
                </div>
              </div>
              {session.org_id && (
                <div className="border-l border-gray-200 pl-4">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Organization</span>
                  <p className="font-medium text-gray-900 mt-1">{session.org_id}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Participants */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                Participants ({session.participants.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {session.participants.map((participant, idx) => (
                <div key={idx} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ts-orange to-ts-teal flex items-center justify-center text-white font-medium">
                    {participant.userAvatar ? (
                      <img
                        src={participant.userAvatar}
                        alt={participant.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      participant.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{participant.userName}</p>
                      {getRoleBadge(participant.role)}
                      {participant.userId === session.host_user_id && (
                        <span className="text-xs text-ts-teal">(Creator)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{participant.userId}</span>
                      {getParticipantStatus(participant.status, participant.leftAt)}
                    </div>
                  </div>
                  {participant.joinedAt && (
                    <div className="text-right text-xs text-gray-400">
                      <p>Joined</p>
                      <p>{new Date(participant.joinedAt).toLocaleTimeString()}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recordings */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-gray-400" />
                Recordings ({session.recordings.length})
              </h3>
            </div>
            {session.recordings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileVideo className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recordings available</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {session.recordings.map((recording, idx) => (
                  <div key={idx} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                          <Play className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Recording {idx + 1}</p>
                          <p className="text-xs text-gray-500">
                            {recording.startedAt
                              ? new Date(recording.startedAt).toLocaleString()
                              : 'Unknown time'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          recording.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : recording.status === 'RECORDING'
                            ? 'bg-red-100 text-red-700'
                            : recording.status === 'PROCESSING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {recording.status}
                      </span>
                    </div>

                    {recording.duration && (
                      <p className="text-sm text-gray-600 mb-3">
                        Duration: {formatDuration(recording.duration)}
                      </p>
                    )}

                    {recording.s3Url && recording.status === 'COMPLETED' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(recording.s3Url, '_blank')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-ts-teal/10 text-ts-teal rounded-lg text-sm font-medium hover:bg-ts-teal/20 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Play
                        </button>
                        <a
                          href={recording.s3Url}
                          download
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transcript & Summary Placeholder */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileVideo className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transcript & AI Summary</h3>
            <p className="text-gray-500 mb-4">
              Transcript and AI-generated summary will be available after recording processing is complete.
            </p>
            <p className="text-sm text-gray-400">Coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
