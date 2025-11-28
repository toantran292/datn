import type { Room } from '../types';

export type SidebarTab = 'thread' | 'members' | 'files';

interface RightSidebarWithTabsProps {
  room: Room;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onClose: () => void;
  threadContent?: React.ReactNode;
  membersContent?: React.ReactNode;
  filesContent?: React.ReactNode;
}

export function RightSidebar({
  room,
  activeTab,
  onTabChange,
  onClose,
  threadContent,
  membersContent,
  filesContent,
}: RightSidebarWithTabsProps) {
  const tabs: { id: SidebarTab; label: string; icon: string }[] = [
    { id: 'thread', label: 'Thread', icon: '💬' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'files', label: 'Files', icon: '📎' },
  ];

  return (
    <div
      style={{
        width: '380px',
        backgroundColor: 'white',
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Channel Detail</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0 8px',
              lineHeight: 1,
            }}
            title="Close sidebar"
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
          {room.name || 'Unnamed Room'}
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          {room.isPrivate ? '🔒 Private' : '🌐 Public'} Room
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '400',
              color: activeTab === tab.id ? '#2196f3' : '#666',
              borderBottom: activeTab === tab.id ? '2px solid #2196f3' : '2px solid transparent',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'thread' && threadContent}
        {activeTab === 'members' && membersContent}
        {activeTab === 'files' && filesContent}
      </div>
    </div>
  );
}

