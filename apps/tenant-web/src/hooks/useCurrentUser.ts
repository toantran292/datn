import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';

interface CurrentUser {
  id: string;
  roles: string[];
  perms: string[];
}

interface MeResponse {
  user: CurrentUser;
  orgId: string;
  projectId?: string;
}

interface UseCurrentUserState {
  user: CurrentUser | null;
  orgId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseCurrentUserReturn extends UseCurrentUserState {
  refetch: () => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  hasAdminAccess: boolean; // owner OR admin
  isMember: boolean;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const [state, setState] = useState<UseCurrentUserState>({
    user: null,
    orgId: null,
    isLoading: true,
    error: null,
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await apiGet<MeResponse>('/tenant/me');
      setState({
        user: response.user,
        orgId: response.orgId,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to fetch current user:', error);
      setState({
        user: null,
        orgId: null,
        isLoading: false,
        error: error.message || 'Failed to fetch user info',
      });
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  console.log('Current User State:', state);

  const roles = state.user?.roles || [];
  const isOwner = roles.includes('OWNER');
  const isAdmin = roles.includes('ADMIN');
  const isMember = roles.includes('MEMBER');
  const hasAdminAccess = isOwner || isAdmin;

  return {
    ...state,
    refetch: fetchCurrentUser,
    isOwner,
    isAdmin,
    hasAdminAccess,
    isMember,
  };
}
