'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Video,
  Users,
  HardDrive,
  Server,
  ChevronDown,
} from 'lucide-react';

type LogLevel = 'info' | 'warning' | 'error' | 'success';
type LogCategory = 'meeting' | 'recording' | 'system' | 'auth';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  meetingId?: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock logs - replace with real API
  useEffect(() => {
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        level: 'info',
        category: 'meeting',
        message: 'Meeting started',
        details: { roomId: 'project-abc-123', host: 'John Doe', participantCount: 1 },
        userId: 'user-123',
        meetingId: 'meet-001',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'success',
        category: 'recording',
        message: 'Recording started successfully',
        details: { recordingId: 'rec-001', format: 'mp4', quality: '1080p' },
        meetingId: 'meet-001',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'warning',
        category: 'system',
        message: 'High CPU usage detected on Jibri node',
        details: { node: 'jibri-01', cpuUsage: 85, threshold: 80 },
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        level: 'info',
        category: 'auth',
        message: 'User authenticated',
        details: { method: 'JWT', ip: '192.168.1.100' },
        userId: 'user-456',
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        level: 'error',
        category: 'recording',
        message: 'Recording failed to start',
        details: { reason: 'No available Jibri instances', meetingId: 'meet-002' },
        meetingId: 'meet-002',
      },
      {
        id: '6',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: 'info',
        category: 'meeting',
        message: 'Participant joined',
        details: { userName: 'Jane Smith', connectionType: 'websocket' },
        userId: 'user-789',
        meetingId: 'meet-001',
      },
      {
        id: '7',
        timestamp: new Date(Date.now() - 360000).toISOString(),
        level: 'success',
        category: 'system',
        message: 'System health check passed',
        details: { services: ['jvb', 'prosody', 'jibri'], status: 'healthy' },
      },
      {
        id: '8',
        timestamp: new Date(Date.now() - 420000).toISOString(),
        level: 'warning',
        category: 'auth',
        message: 'Invalid token attempt',
        details: { ip: '203.0.113.50', attempts: 3 },
      },
      {
        id: '9',
        timestamp: new Date(Date.now() - 480000).toISOString(),
        level: 'info',
        category: 'meeting',
        message: 'Meeting ended',
        details: { roomId: 'chat-xyz-456', duration: 1800, totalParticipants: 5 },
        meetingId: 'meet-003',
      },
      {
        id: '10',
        timestamp: new Date(Date.now() - 540000).toISOString(),
        level: 'success',
        category: 'recording',
        message: 'Recording uploaded to S3',
        details: { recordingId: 'rec-002', size: '245MB', bucket: 'meeting-recordings' },
        meetingId: 'meet-003',
      },
    ];
    setLogs(mockLogs);
  }, []);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    const data = filteredLogs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      category: log.category,
      message: log.message,
      details: JSON.stringify(log.details),
    }));
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'info':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'success':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
    }
  };

  const getCategoryIcon = (category: LogCategory) => {
    switch (category) {
      case 'meeting':
        return <Video className="w-3 h-3" />;
      case 'recording':
        return <HardDrive className="w-3 h-3" />;
      case 'system':
        return <Server className="w-3 h-3" />;
      case 'auth':
        return <Users className="w-3 h-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-800/30 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-white">System Logs</h1>
              <p className="text-sm text-gray-400">Real-time event monitoring</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={e => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-ts-teal focus:ring-ts-teal"
                />
                Auto-refresh
              </label>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ts-teal/50 focus:border-ts-teal"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-ts-teal/50"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-ts-teal/50"
            >
              <option value="all">All Categories</option>
              <option value="meeting">Meeting</option>
              <option value="recording">Recording</option>
              <option value="system">System</option>
              <option value="auth">Auth</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {(['info', 'warning', 'error', 'success'] as LogLevel[]).map(level => {
            const count = logs.filter(l => l.level === level).length;
            return (
              <button
                key={level}
                onClick={() => setLevelFilter(levelFilter === level ? 'all' : level)}
                className={`p-4 rounded-xl border transition-colors ${
                  levelFilter === level
                    ? getLevelColor(level)
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {getLevelIcon(level)}
                  <span className="text-2xl font-bold text-white">{count}</span>
                </div>
                <p className="text-sm text-gray-400 capitalize">{level}</p>
              </button>
            );
          })}
        </div>

        {/* Logs List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-700">
            {filteredLogs.map(log => (
              <div key={log.id} className="hover:bg-gray-700/50 transition-colors">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs border ${getLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
                          {getCategoryIcon(log.category)}
                          {log.category}
                        </span>
                        {log.meetingId && (
                          <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-500">
                            {log.meetingId}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white">{log.message}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                      <p>{formatTime(log.timestamp)}</p>
                      <p>{formatDate(log.timestamp)}</p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        expandedLogId === log.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedLogId === log.id && log.details && (
                  <div className="px-4 pb-4 pl-11">
                    <div className="p-3 bg-gray-900/50 rounded-lg">
                      <pre className="text-xs text-gray-400 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-16">
                <Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No logs found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
