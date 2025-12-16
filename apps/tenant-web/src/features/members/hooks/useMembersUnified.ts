import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete, apiPatch } from '@/lib/api';

// Unified member type (can be active member or pending invitation)
export interface UnifiedMember {
  id: string;
  type: 'member' | 'invitation';
  email: string;
  displayName: string;
  role: string;
  status: 'active' | 'pending';
  avatarUrl?: string;
  joinedAt?: string;
  invitedAt?: string;
  projectRoles?: { projectId: string; projectName: string; role: string }[];
}

// Response from tenant-bff GET /members (unified endpoint)
interface UnifiedMembersResponse {
  items: UnifiedMember[];
  totalMembers: number;
  totalInvitations: number;
  total: number;
}

interface UseMembersUnifiedState {
  items: UnifiedMember[];
  totalMembers: number;
  totalInvitations: number;
  isLoading: boolean;
  error: string | null;
}

interface UseMembersUnifiedReturn extends UseMembersUnifiedState {
  refetch: () => Promise<void>;
  invite: (data: { email: string; role: string; project_ids?: string[] }) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
  resendInvitation: (invitationId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, role: string) => Promise<boolean>;
}

export function useMembersUnified(): UseMembersUnifiedReturn {
  const [state, setState] = useState<UseMembersUnifiedState>({
    items: [],
    totalMembers: 0,
    totalInvitations: 0,
    isLoading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Call tenant-bff unified endpoint (gateway routes /tenant/* to tenant-bff)
      const response = await apiGet<UnifiedMembersResponse>('/tenant/members');

      setState({
        items: response.items || [],
        totalMembers: response.totalMembers || 0,
        totalInvitations: response.totalInvitations || 0,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      setState({
        items: [],
        totalMembers: 0,
        totalInvitations: 0,
        isLoading: false,
        error: error.message || 'Failed to fetch members',
      });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invite = useCallback(async (data: { email: string; role: string; project_ids?: string[] }): Promise<boolean> => {
    try {
      await apiPost('/tenant/members/invite', data);
      // Refetch to get updated list
      await fetchData();
      return true;
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to invite member',
      }));
      return false;
    }
  }, [fetchData]);

  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    try {
      await apiDelete(`/tenant/members/${memberId}`);
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => !(item.type === 'member' && item.id === memberId)),
        totalMembers: prev.totalMembers - 1,
      }));
      return true;
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to remove member',
      }));
      return false;
    }
  }, []);

  const cancelInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    try {
      await apiDelete(`/tenant/members/invitations/${invitationId}`);
      setState(prev => ({
        ...prev,
        items: prev.items.filter(item => !(item.type === 'invitation' && item.id === invitationId)),
        totalInvitations: prev.totalInvitations - 1,
      }));
      return true;
    } catch (error: any) {
      console.error('Failed to cancel invitation:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to cancel invitation',
      }));
      return false;
    }
  }, []);

  const resendInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    try {
      await apiPost(`/tenant/members/invitations/${invitationId}/resend`, {});
      return true;
    } catch (error: any) {
      console.error('Failed to resend invitation:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to resend invitation',
      }));
      return false;
    }
  }, []);

  const updateMemberRole = useCallback(async (memberId: string, role: string): Promise<boolean> => {
    try {
      await apiPatch(`/tenant/members/${memberId}/role`, { role });
      // Update local state
      setState(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.type === 'member' && item.id === memberId
            ? { ...item, role: role.toLowerCase() }
            : item
        ),
      }));
      return true;
    } catch (error: any) {
      console.error('Failed to update member role:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update member role',
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    refetch: fetchData,
    invite,
    removeMember,
    cancelInvitation,
    resendInvitation,
    updateMemberRole,
  };
}
