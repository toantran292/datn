import { MessageSquare, Users, Paperclip, X, Hash, Lock, Bot } from 'lucide-react';
import type { Room } from '../../types';

export type DetailsTab = 'thread' | 'members' | 'files' | 'ai';

export interface DetailsPanelProps {
  room: Room;
  activeTab: DetailsTab;
  onTabChange: (tab: DetailsTab) => void;
  onClose: () => void;
  threadContent?: React.ReactNode;
  membersContent?: React.ReactNode;
  filesContent?: React.ReactNode;
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
  aiContent,
}: DetailsPanelProps) {
  // Only show AI tab for channels (not DMs)
  const showAITab = room.type === 'channel';

  const tabs: { id: DetailsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'thread', label: 'Thread', icon: <MessageSquare size={16} /> },
    { id: 'members', label: 'Members', icon: <Users size={16} /> },
    { id: 'files', label: 'Files', icon: <Paperclip size={16} /> },
    ...(showAITab ? [{ id: 'ai' as DetailsTab, label: 'AI', icon: <Bot size={16} /> }] : []),
  ];

  return (
    <div className="w-[360px] bg-custom-background-100 border-l border-custom-border-200 flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-custom-border-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-custom-text-300">
              {room.type === 'dm' ? null : (room.isPrivate ? <Lock size={16} /> : <Hash size={16} />)}
            </span>
            <h3 className="font-semibold text-custom-text-100">
              {room.name || 'Direct Message'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-custom-text-400">
          {room.isPrivate ? 'Private channel' : room.type === 'dm' ? 'Direct message' : 'Public channel'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-custom-border-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
              border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'text-custom-primary-100 border-custom-primary-100'
                : 'text-custom-text-300 border-transparent hover:text-custom-text-100 hover:bg-custom-background-80'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'thread' && threadContent}
        {activeTab === 'members' && membersContent}
        {activeTab === 'files' && filesContent}
        {activeTab === 'ai' && aiContent}
      </div>
    </div>
  );
}
