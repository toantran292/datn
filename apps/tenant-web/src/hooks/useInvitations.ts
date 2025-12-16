import { useState, useEffect, useCallback } from 'react';
import {
  Invitation,
  getInvitations,
  cancelInvitation as cancelInvitationApi,
} from '../lib/api';

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
  const [state, setState] = useState<UseInvitationsState>({
    invitations: [],
    isLoading: true,
    error: null,
  });

  const fetchInvitations = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await getInvitations();
      setState({ invitations: response.invitations, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
      setState({
        invitations: [],
        isLoading: false,
        error: error.message || 'Failed to fetch invitations'
      });
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const cancel = useCallback(async (invitationId: string): Promise<boolean> => {
    try {
      await cancelInvitationApi(invitationId);
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
  }, []);

  return {
    ...state,
    refetch: fetchInvitations,
    cancel,
  };
}
