import { useState, useEffect, useCallback } from 'react';
import {
  Member,
  PagedResponse,
  getOrgMembers,
  inviteMember,
  updateMember,
  removeMember,
  InviteMemberRequest,
  UpdateMemberRequest
} from '../lib/api';

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
      const response = await getOrgMembers(0, 100); // Fetch first 100 members
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
      const newMember = await inviteMember(data);
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
      const updatedMember = await updateMember(memberId, data);
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
      await removeMember(memberId);
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
