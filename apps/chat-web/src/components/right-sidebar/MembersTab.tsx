import { useState, useEffect } from 'react';

interface Member {
  userId: string;
  displayName?: string;
  status?: 'online' | 'offline';
}

interface MembersTabProps {
  roomId: string;
  onLoadMembers?: () => Promise<Member[]>;
}

export function MembersTab({ roomId, onLoadMembers }: MembersTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Only reload when roomId changes, not when onLoadMembers changes

  const loadMembers = async () => {
    setLoading(true);
    try {
      if (onLoadMembers) {
        const data = await onLoadMembers();
        setMembers(data);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
        Loading members...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f9f9f9' }}>
        <div style={{ fontSize: '13px', color: '#666' }}>
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </div>
      </div>

      {/* Members List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {members.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
            No members found
          </div>
        ) : (
          <div style={{ padding: '8px' }}>
            {members.map((member) => (
              <div
                key={member.userId}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#2196f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    flexShrink: 0,
                  }}
                >
                  {(member.displayName || member.userId).charAt(0).toUpperCase()}
                </div>

                {/* Member Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    {member.displayName || `User ${member.userId.slice(0, 8)}`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.userId.slice(0, 16)}...
                  </div>
                </div>

                {/* Status */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: member.status === 'online' ? '#4caf50' : '#bdbdbd',
                    flexShrink: 0,
                  }}
                  title={member.status === 'online' ? 'Online' : 'Offline'}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
        <button
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onClick={() => alert('Add member functionality - TODO')}
        >
          <span>➕</span>
          <span>Add Members</span>
        </button>
      </div>
    </div>
  );
}

