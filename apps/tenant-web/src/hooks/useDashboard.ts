import { useState, useEffect, useCallback } from 'react';
import { DashboardResponse, getDashboard } from '../lib/api';

interface UseDashboardState {
  data: DashboardResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface UseDashboardReturn extends UseDashboardState {
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [state, setState] = useState<UseDashboardState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchDashboard = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await getDashboard();
      setState({ data: response, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Failed to fetch dashboard:', error);
      setState({
        data: null,
        isLoading: false,
        error: error.message || 'Failed to fetch dashboard'
      });
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    ...state,
    refetch: fetchDashboard,
  };
}
