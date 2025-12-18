'use client';

import { useEffect } from 'react';
import { MessageSquare, Users, Paperclip, X, Hash, Lock, Bot, Pin } from 'lucide-react';
import type { Room } from '../../types';
import { useResponsive } from '../../hooks/useResponsive';

export type DetailsTab = 'thread' | 'members' | 'files' | 'pinned' | 'ai';

export interface DetailsPanelProps {
  room: Room;
  activeTab: DetailsTab;
  onTabChange: (tab: DetailsTab) => void;
  onClose: () => void;
  threadContent?: React.ReactNode;
  membersContent?: React.ReactNode;
  filesContent?: React.ReactNode;
  pinnedContent?: React.ReactNode;
  aiContent?: React.ReactNode;
}

export function DetailsPanel({
  room,
  activeTab,
  onTabChange,
  onClose,
  threadContent,
  membersContent,
  filesContent,
  pinnedContent,
  aiContent,
}: DetailsPanelProps) {
  const { isMobile, closeDetailsPanel } = useResponsive();

  // Only show AI tab for channels (not DMs)
  const showAITab = room.type === 'channel';

  // Reset to thread tab if current tab is AI and room is DM
  useEffect(() => {
    if (activeTab === 'ai' && room.type === 'dm') {
      onTabChange('thread');
    }
  }, [room.type, activeTab, onTabChange]);

  const tabs: { id: DetailsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'thread', label: 'Thread', icon: <MessageSquare size={16} /> },
    { id: 'members', label: 'Thành viên', icon: <Users size={16} /> },
    { id: 'files', label: 'Tệp', icon: <Paperclip size={16} /> },
    { id: 'pinned', label: 'Ghim', icon: <Pin size={16} /> },
    ...(showAITab ? [{ id: 'ai' as DetailsTab, label: 'AI', icon: <Bot size={16} /> }] : []),
  ];

  const handleClose = () => {
    closeDetailsPanel();
    onClose();
  };

  return (
    <div className={`
      bg-custom-background-100 border-l border-custom-border-200 flex flex-col flex-shrink-0 overflow-hidden h-full
      ${isMobile ? 'w-[85vw] max-w-[360px]' : 'w-[360px]'}
    `}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-custom-border-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-custom-text-300 flex-shrink-0">
              {room.type === 'dm' ? null : (room.isPrivate ? <Lock size={16} /> : <Hash size={16} />)}
            </span>
            <h3 className="font-semibold text-custom-text-100 truncate text-base">
              {room.name || 'Tin nhắn riêng'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 rounded-lg text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors flex-shrink-0"
            title="Đóng bảng"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-custom-text-400">
          {room.isPrivate ? 'Kênh riêng tư' : room.type === 'dm' ? 'Tin nhắn riêng' : 'Kênh công khai'}
        </p>
      </div>

      {/* Tabs - Always show labels */}
      <div className="flex border-b border-custom-border-200 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-sm font-medium
              border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'text-custom-primary-100 border-custom-primary-100'
                : 'text-custom-text-300 border-transparent hover:text-custom-text-100 hover:bg-custom-background-80'
              }
            `}
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'thread' && threadContent}
        {activeTab === 'members' && membersContent}
        {activeTab === 'files' && filesContent}
        {activeTab === 'pinned' && pinnedContent}
        {activeTab === 'ai' && aiContent}
      </div>
    </div>
  );
}
