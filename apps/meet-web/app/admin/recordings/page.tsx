'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  Trash2,
  Play,
  HardDrive,
  Clock,
  Calendar,
  FileVideo,
  Eye,
  Link,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Video,
} from 'lucide-react';

type RecordingStatus = 'RECORDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface Recording {
  id: string;
  sessionId: string;
  meetingId: string;
  roomId: string;
  hostName: string;
  status: RecordingStatus;
  startedAt: string;
  stoppedAt?: string;
  duration?: number;
  fileSize?: number;
  s3Url?: string;
  error?: string;
}

export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RecordingStatus | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Mock data
  useEffect(() => {
    const mockRecordings: Recording[] = [
      {
        id: 'rec-001',
        sessionId: 'session-001',
        meetingId: 'meet-001',
        roomId: 'project-design-review-123',
        hostName: 'John Doe',
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        stoppedAt: new Date(Date.now() - 3600000).toISOString(),
        duration: 3600,
        fileSize: 524288000, // 500MB
        s3Url: 'https://s3.example.com/recordings/rec-001.mp4',
      },
      {
        id: 'rec-002',
        sessionId: 'session-002',
        meetingId: 'meet-002',
        roomId: 'chat-team-standup-456',
        hostName: 'Sarah Johnson',
        status: 'PROCESSING',
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        stoppedAt: new Date(Date.now() - 1800000).toISOString(),
        duration: 1800,
      },
      {
        id: 'rec-003',
        sessionId: 'session-003',
        meetingId: 'meet-003',
        roomId: 'project-sprint-planning-789',
        hostName: 'David Kim',
        status: 'RECORDING',
        startedAt: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: 'rec-004',
        sessionId: 'session-004',
        meetingId: 'meet-004',
        roomId: 'chat-all-hands-111',
        hostName: 'Emily Chen',
        status: 'FAILED',
        startedAt: new Date(Date.now() - 86400000).toISOString(),
        error: 'Jibri instance became unavailable during recording',
      },
      {
        id: 'rec-005',
        sessionId: 'session-005',
        meetingId: 'meet-005',
        roomId: 'project-code-review-222',
        hostName: 'Mike Lee',
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 172800000).toISOString(),
        stoppedAt: new Date(Date.now() - 169200000).toISOString(),
        duration: 3600,
        fileSize: 1073741824, // 1GB
        s3Url: 'https://s3.example.com/recordings/rec-005.mp4',
      },
    ];
    setRecordings(mockRecordings);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} recording(s)? This action cannot be undone.`)) return;

    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRecordings(prev => prev.filter(r => !ids.includes(r.id)));
    setSelectedRecordings(new Set());
    setIsDeleting(false);
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedRecordings);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRecordings(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedRecordings.size === filteredRecordings.length) {
      setSelectedRecordings(new Set());
    } else {
      setSelectedRecordings(new Set(filteredRecordings.map(r => r.id)));
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '--';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: RecordingStatus) => {
    switch (status) {
      case 'RECORDING':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Recording
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Failed
          </span>
        );
    }
  };

  const filteredRecordings = recordings.filter(r => {
    const matchesSearch =
      r.roomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSize = recordings
    .filter(r => r.fileSize)
    .reduce((sum, r) => sum + (r.fileSize || 0), 0);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-800/30 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-white">Recordings</h1>
              <p className="text-sm text-gray-400">Manage meeting recordings</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">
                <span className="text-white font-medium">{recordings.length}</span> recordings
                <span className="mx-2">•</span>
                <span className="text-white font-medium">{formatFileSize(totalSize)}</span> total
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
        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by room ID, host, or recording ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ts-teal/50 focus:border-ts-teal"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-ts-teal/50"
            >
              <option value="all">All Status</option>
              <option value="RECORDING">Recording</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>

            {selectedRecordings.size > 0 && (
              <button
                onClick={() => handleDelete(Array.from(selectedRecordings))}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete ({selectedRecordings.size})
              </button>
            )}
          </div>
        </div>

        {/* Recordings Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-700/50 text-sm font-medium text-gray-400 border-b border-gray-700">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedRecordings.size === filteredRecordings.length && filteredRecordings.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-600 bg-gray-700 text-ts-teal focus:ring-ts-teal"
              />
            </div>
            <div className="col-span-4">Recording</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-1">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-700">
            {filteredRecordings.map(recording => (
              <div
                key={recording.id}
                className={`grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-700/30 transition-colors ${
                  selectedRecordings.has(recording.id) ? 'bg-ts-teal/5' : ''
                }`}
              >
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedRecordings.has(recording.id)}
                    onChange={() => toggleSelection(recording.id)}
                    className="rounded border-gray-600 bg-gray-700 text-ts-teal focus:ring-ts-teal"
                  />
                </div>

                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center">
                      <FileVideo className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm truncate max-w-[250px]">
                        {recording.roomId}
                      </p>
                      <p className="text-xs text-gray-500">
                        {recording.hostName} • {formatDate(recording.startedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 flex items-center">
                  {getStatusBadge(recording.status)}
                </div>

                <div className="col-span-2 flex items-center text-sm text-gray-400">
                  <Clock className="w-4 h-4 mr-1.5" />
                  {formatDuration(recording.duration)}
                </div>

                <div className="col-span-2 flex items-center text-sm text-gray-400">
                  <HardDrive className="w-4 h-4 mr-1.5" />
                  {formatFileSize(recording.fileSize)}
                </div>

                <div className="col-span-1 flex items-center gap-1">
                  {recording.status === 'COMPLETED' && recording.s3Url && (
                    <>
                      <button
                        onClick={() => window.open(recording.s3Url, '_blank')}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Play"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <a
                        href={recording.s3Url}
                        download
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete([recording.id])}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredRecordings.length === 0 && (
              <div className="text-center py-16">
                <FileVideo className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No recordings found</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try adjusting your search' : 'No recordings available'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Storage Info */}
        <div className="mt-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white">Storage Usage</p>
                <p className="text-sm text-gray-500">S3 bucket: meeting-recordings</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-white">{formatFileSize(totalSize)}</p>
              <p className="text-sm text-gray-500">of 100 GB used</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-ts-teal"
                style={{ width: `${Math.min((totalSize / (100 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
