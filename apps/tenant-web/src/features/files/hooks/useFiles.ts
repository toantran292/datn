import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'video' | 'audio' | 'other';
  mimeType: string;
  size: number;
  sizeFormatted: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface FilesListResponse {
  items: FileItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface StorageUsage {
  usedBytes: number;
  fileCount: number;
}

interface UseFilesState {
  files: FileItem[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  storageUsage: StorageUsage | null;
}

interface UseFilesFilters {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface UseFilesReturn extends UseFilesState {
  refetch: () => Promise<void>;
  setFilters: (filters: UseFilesFilters) => void;
  uploadFile: (file: File, metadata?: { tags?: string[]; description?: string }) => Promise<FileItem | null>;
  deleteFile: (fileId: string) => Promise<boolean>;
  getDownloadUrl: (fileId: string) => Promise<string | null>;
}

export function useFiles(initialFilters?: UseFilesFilters): UseFilesReturn {
  const [filters, setFiltersState] = useState<UseFilesFilters>({
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  const [state, setState] = useState<UseFilesState>({
    files: [],
    total: 0,
    page: 1,
    totalPages: 0,
    isLoading: true,
    error: null,
    storageUsage: null,
  });

  const fetchFiles = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());
      if (filters.search) params.set('search', filters.search);
      if (filters.type && filters.type !== 'all') params.set('type', filters.type);

      const [filesRes, storageRes] = await Promise.all([
        apiGet<FilesListResponse>(`/tenant/files?${params.toString()}`),
        apiGet<StorageUsage>('/tenant/files/storage'),
      ]);

      setState({
        files: filesRes.items || [],
        total: filesRes.total || 0,
        page: filesRes.page || 1,
        totalPages: filesRes.totalPages || 0,
        isLoading: false,
        error: null,
        storageUsage: storageRes,
      });
    } catch (error: any) {
      console.error('Failed to fetch files:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch files',
      }));
    }
  }, [filters]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const setFilters = useCallback((newFilters: UseFilesFilters) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when search or type changes
      page: newFilters.search !== undefined || newFilters.type !== undefined ? 1 : newFilters.page ?? prev.page,
    }));
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    metadata?: { tags?: string[]; description?: string }
  ): Promise<FileItem | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata?.tags?.length) {
        formData.append('tags', metadata.tags.join(','));
      }
      if (metadata?.description) {
        formData.append('description', metadata.description);
      }

      const response = await apiPost<{ success: boolean; file: FileItem }>(
        '/tenant/files/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.success && response.file) {
        // Refetch to update list
        await fetchFiles();
        return response.file;
      }

      return null;
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }, [fetchFiles]);

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      await apiDelete(`/tenant/files/${fileId}`);

      // Update local state
      setState(prev => ({
        ...prev,
        files: prev.files.filter(f => f.id !== fileId),
        total: prev.total - 1,
      }));

      return true;
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }, []);

  const getDownloadUrl = useCallback(async (fileId: string): Promise<string | null> => {
    try {
      const response = await apiPost<{ url: string; expiresAt: string }>(
        `/tenant/files/${fileId}/download-url`,
        {}
      );
      return response.url || null;
    } catch (error: any) {
      console.error('Failed to get download URL:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    refetch: fetchFiles,
    setFilters,
    uploadFile,
    deleteFile,
    getDownloadUrl,
  };
}
