import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiDelete } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface Invitation {
  id: string;
  email: string;
  memberType: string;
  createdAt: string;
}

interface InvitationsResponse {
  invitations: Invitation[];
}

interface UseInvitationsState {
  invitations: Invitation[];
  isLoading: boolean;
  error: string | null;
}

interface UseInvitationsReturn extends UseInvitationsState {
  refetch: () => Promise<void>;
  cancel: (invitationId: string) => Promise<boolean>;
}

export function useInvitations(): UseInvitationsReturn {
  const { orgId } = useCurrentUser();
  const [state, setState] = useState<UseInvitationsState>({
    invitations: [],
    isLoading: true,
    error: null,
  });

  const fetchInvitations = useCallback(async () => {
    if (!orgId) {
      setState({ invitations: [], isLoading: false, error: null });
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await apiGet<InvitationsResponse>(`/orgs/${orgId}/invitations`);
      setState({ invitations: response.invitations || [], isLoading: false, error: null });
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
      setState({
        invitations: [],
        isLoading: false,
        error: error.message || 'Failed to fetch invitations'
      });
    }
  }, [orgId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const cancel = useCallback(async (invitationId: string): Promise<boolean> => {
    if (!orgId) return false;

    try {
      await apiDelete(`/orgs/${orgId}/invitations/${invitationId}`);
      setState(prev => ({
        ...prev,
        invitations: prev.invitations.filter(inv => inv.id !== invitationId),
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
  }, [orgId]);

  return {
    ...state,
    refetch: fetchInvitations,
    cancel,
  };
}
