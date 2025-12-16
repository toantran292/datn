import { useState, useEffect, useCallback } from 'react';
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  type Member,
  type PagedResponse,
  type InviteMemberRequest,
  type UpdateMemberRequest
} from '@/lib/api';

interface UseMembersState {
  members: Member[];
  totalMembers: number;
  isLoading: boolean;
  error: string | null;
}

interface UseMembersReturn extends UseMembersState {
  refetch: () => Promise<void>;
  invite: (data: InviteMemberRequest) => Promise<Member | null>;
  update: (memberId: string, data: UpdateMemberRequest) => Promise<Member | null>;
  remove: (memberId: string) => Promise<boolean>;
}

export function useMembers(): UseMembersReturn {
  const [state, setState] = useState<UseMembersState>({
    members: [],
    totalMembers: 0,
    isLoading: true,
    error: null,
  });

  const fetchMembers = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await apiGet<PagedResponse<Member>>('/tenant/members?page=0&size=100');
      setState({ members: response.items, totalMembers: response.total, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      setState({
        members: [],
        totalMembers: 0,
        isLoading: false,
        error: error.message || 'Failed to fetch members'
      });
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const invite = useCallback(async (data: InviteMemberRequest): Promise<Member | null> => {
    try {
      const newMember = await apiPost<Member>('/tenant/members/invite', data);
      setState(prev => ({
        ...prev,
        members: [...prev.members, newMember],
      }));
      return newMember;
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to invite member',
      }));
      return null;
    }
  }, []);

  const update = useCallback(async (memberId: string, data: UpdateMemberRequest): Promise<Member | null> => {
    try {
      const updatedMember = await apiPut<Member>(`/tenant/members/${memberId}`, data);
      setState(prev => ({
        ...prev,
        members: prev.members.map(m => m.id === memberId ? updatedMember : m),
      }));
      return updatedMember;
    } catch (error: any) {
      console.error('Failed to update member:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update member',
      }));
      return null;
    }
  }, []);

  const remove = useCallback(async (memberId: string): Promise<boolean> => {
    try {
      await apiDelete(`/tenant/members/${memberId}`);
      setState(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== memberId),
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

  return {
    ...state,
    refetch: fetchMembers,
    invite,
    update,
    remove,
  };
}
