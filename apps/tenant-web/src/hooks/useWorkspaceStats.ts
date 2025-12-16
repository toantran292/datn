import { useState, useEffect, useCallback } from 'react';
import { StatsResponse, getStats } from '../lib/api';

interface UseWorkspaceStatsState {
  stats: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface UseWorkspaceStatsReturn extends UseWorkspaceStatsState {
  refetch: () => Promise<void>;
}

export function useWorkspaceStats(): UseWorkspaceStatsReturn {
  const [state, setState] = useState<UseWorkspaceStatsState>({
    stats: null,
    isLoading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await getStats();
      setState({ stats: response, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Failed to fetch workspace stats:', error);
      setState({
        stats: null,
        isLoading: false,
        error: error.message || 'Failed to fetch workspace stats'
      });
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...state,
    refetch: fetchStats,
  };
}
