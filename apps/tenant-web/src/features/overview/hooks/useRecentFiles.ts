import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/lib/api';

export interface RecentFile {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  uploadedBy: { id: string; name: string };
  uploadedAt: string;
  size: number;
}

interface UseRecentFilesState {
  files: RecentFile[];
  isLoading: boolean;
  error: string | null;
}

interface UseRecentFilesReturn extends UseRecentFilesState {
  refetch: () => Promise<void>;
}

interface FileMetadataFromAPI {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  service: string;
  modelType: string;
  subjectId: string;
  uploadedBy?: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export function useRecentFiles(limit: number = 5): UseRecentFilesReturn {
  const [state, setState] = useState<UseRecentFilesState>({
    files: [],
    isLoading: true,
    error: null,
  });

  const fetchRecentFiles = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await apiGet<{ files: FileMetadataFromAPI[] }>(
        `/tenant/dashboard/recent-files?limit=${limit}`
      );

      // Map API response to RecentFile format
      const files: RecentFile[] = (response.files || []).map((file) => ({
        id: file.id,
        name: file.originalName,
        projectId: file.subjectId || '',
        // modelType could be 'project', 'issue', etc. - use service name for now
        projectName: file.service || 'General',
        uploadedBy: {
          id: file.uploadedBy || '',
          name: file.uploadedBy || 'System',
        },
        uploadedAt: file.createdAt,
        size: file.size,
      }));

      setState({ files, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Failed to fetch recent files:', error);
      setState({
        files: [],
        isLoading: false,
        error: error.message || 'Failed to fetch recent files',
      });
    }
  }, [limit]);

  useEffect(() => {
    fetchRecentFiles();
  }, [fetchRecentFiles]);

  return {
    ...state,
    refetch: fetchRecentFiles,
  };
}
