import { useState, useEffect, useCallback } from 'react';
import { Activity, ActivitiesResponse, getActivities } from '../lib/api';

interface UseWorkspaceActivitiesState {
  activities: Activity[];
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseWorkspaceActivitiesReturn extends UseWorkspaceActivitiesState {
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useWorkspaceActivities(initialLimit: number = 10): UseWorkspaceActivitiesReturn {
  const [limit, setLimit] = useState(initialLimit);
  const [state, setState] = useState<UseWorkspaceActivitiesState>({
    activities: [],
    hasMore: false,
    isLoading: true,
    error: null,
  });

  const fetchActivities = useCallback(async (currentLimit: number) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await getActivities(currentLimit);
      setState({
        activities: response.activities,
        hasMore: response.hasMore,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Failed to fetch activities:', error);
      setState({
        activities: [],
        hasMore: false,
        isLoading: false,
        error: error.message || 'Failed to fetch activities'
      });
    }
  }, []);

  useEffect(() => {
    fetchActivities(limit);
  }, [fetchActivities, limit]);

  const refetch = useCallback(async () => {
    await fetchActivities(limit);
  }, [fetchActivities, limit]);

  const loadMore = useCallback(async () => {
    const newLimit = limit + 10;
    setLimit(newLimit);
  }, [limit]);

  return {
    ...state,
    refetch,
    loadMore,
  };
}
