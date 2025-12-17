'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMeetingToken } from '@/lib/api';

function MeetPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const joinTriggered = useRef(false);

  const userId = searchParams.get('userId');
  const userName = searchParams.get('userName') || 'User';
  const chatId = searchParams.get('chatId');
  const projectId = searchParams.get('projectId');
  const orgId = searchParams.get('orgId');
  const subjectType = searchParams.get('subjectType') as 'chat' | 'project' | null;
  const isEmbedMode = searchParams.get('embed') === 'true';

  // Auto-join meeting - no waiting room needed
  useEffect(() => {
    if (joinTriggered.current) return;
    if (!userId || (!chatId && !projectId)) return;

    joinTriggered.current = true;

    const joinMeeting = async () => {
      try {
        // Determine subject type: use explicit param, or infer from chatId/projectId
        const effectiveSubjectType = subjectType || (projectId ? 'project' : 'chat');

        const response = await getMeetingToken(
          effectiveSubjectType === 'chat'
            ? {
                user_id: userId,
                subject_type: 'chat',
                chat_id: chatId!,
                user_name: userName,
                org_id: orgId || undefined,
              }
            : {
                user_id: userId,
                subject_type: 'project',
                project_id: projectId!,
                user_name: userName,
                org_id: orgId || undefined,
              }
        );

        // Store meeting info in localStorage
        localStorage.setItem('meetingId', response.meeting_id);
        localStorage.setItem('roomId', response.room_id);
        localStorage.setItem('jwtToken', response.token);
        localStorage.setItem('websocketUrl', response.websocket_url);
        localStorage.setItem('iceServers', JSON.stringify(response.ice_servers));
        localStorage.setItem('name', userName);
        localStorage.setItem('userId', userId);

        // Navigate to meeting room - preserve embed mode
        const roomUrl = isEmbedMode
          ? `/meet/${response.room_id}?embed=true`
          : `/meet/${response.room_id}`;
        router.push(roomUrl);
      } catch (err: any) {
        console.error('Failed to join meeting:', err);
        setError(err.message || 'Failed to join meeting. Please try again.');
      }
    };

    joinMeeting();
  }, [userId, userName, chatId, projectId, orgId, subjectType, router, isEmbedMode]);

  // Redirect if no meeting context
  if (!chatId && !projectId) {
    router.push('/not-found');
    return null;
  }

  // Redirect if no userId - go to join page to enter name
  if (!userId) {
    const params = new URLSearchParams();
    if (chatId) params.set('chatId', chatId);
    if (projectId) params.set('projectId', projectId);
    if (orgId) params.set('orgId', orgId);
    if (subjectType) params.set('subjectType', subjectType);
    router.push(`/join?${params.toString()}`);
    return null;
  }

  // Show error if failed to join
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--ts-bg-dark)' }}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Không thể tham gia</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-ts-orange text-white rounded-xl font-semibold hover:bg-ts-orange/90 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner while joining
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--ts-bg-dark)' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-ts-orange/20 border-t-ts-orange mx-auto mb-4" />
        <p className="text-white/70">Đang tham gia cuộc họp...</p>
      </div>
    </div>
  );
}

export default function MeetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--ts-bg-dark)' }}>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ts-orange/20 border-t-ts-orange" />
        </div>
      }
    >
      <MeetPageContent />
    </Suspense>
  );
}
