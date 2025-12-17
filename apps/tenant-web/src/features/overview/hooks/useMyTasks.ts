import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';

export interface MyTask {
  id: string;
  sequenceId: number;
  name: string;
  description?: string;
  type: 'STORY' | 'TASK' | 'BUG' | 'EPIC' | 'SUBTASK';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  point?: number;
  startDate?: string;
  targetDate?: string;
  status: {
    id: string;
    name: string;
    color: string;
  };
  project?: {
    id: string;
    name: string;
    identifier: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UseMyTasksState {
  tasks: MyTask[];
  isLoading: boolean;
  error: string | null;
}

interface UseMyTasksReturn extends UseMyTasksState {
  refetch: () => Promise<void>;
}

export function useMyTasks(): UseMyTasksReturn {
  const [state, setState] = useState<UseMyTasksState>({
    tasks: [],
    isLoading: true,
    error: null,
  });

  const fetchMyTasks = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await apiGet<MyTask[]>('/tenant/dashboard/my-tasks');
      setState({ tasks: response, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Failed to fetch my tasks:', error);
      setState({
        tasks: [],
        isLoading: false,
        error: error.message || 'Failed to fetch tasks'
      });
    }
  }, []);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  return {
    ...state,
    refetch: fetchMyTasks,
  };
}
