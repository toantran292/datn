import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

export interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'video' | 'audio' | 'other';
  mimeType: string;
  size: number;
  sizeFormatted: string;
  folderId: string | null;
  uploadedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  isUsedInReports: boolean;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface WorkspaceFilesResponse {
  files: FileItem[];
  folders: FolderItem[];
  breadcrumb: BreadcrumbItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseWorkspaceFilesState {
  files: FileItem[];
  folders: FolderItem[];
  breadcrumb: BreadcrumbItem[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  currentFolderId: string | null;
}

interface UseWorkspaceFilesFilters {
  folderId?: string | null;
  search?: string;
  type?: string;
  sortBy?: 'name' | 'size' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface UseWorkspaceFilesReturn extends UseWorkspaceFilesState {
  refetch: () => Promise<void>;
  setFilters: (filters: UseWorkspaceFilesFilters) => void;
  navigateToFolder: (folderId: string | null) => void;
  createFolder: (name: string) => Promise<FolderItem | null>;
  deleteFolder: (folderId: string) => Promise<boolean>;
  moveFile: (fileId: string, folderId: string | null) => Promise<boolean>;
  deleteFile: (fileId: string) => Promise<boolean>;
  batchDeleteFiles: (fileIds: string[]) => Promise<{ deleted: number; failed: string[] }>;
  getDownloadUrl: (fileId: string) => Promise<string | null>;
  getPresignedUploadUrl: (fileInfo: {
    fileName: string;
    mimeType: string;
    size: number;
  }) => Promise<{ assetId: string; presignedUrl: string } | null>;
}

export function useWorkspaceFiles(
  workspaceId: string,
  initialFilters?: UseWorkspaceFilesFilters
): UseWorkspaceFilesReturn {
  const [filters, setFiltersState] = useState<UseWorkspaceFilesFilters>({
    folderId: null,
    page: 1,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  const [state, setState] = useState<UseWorkspaceFilesState>({
    files: [],
    folders: [],
    breadcrumb: [{ id: null, name: 'Root' }],
    total: 0,
    page: 1,
    totalPages: 0,
    isLoading: true,
    error: null,
    currentFolderId: null,
  });

  const fetchFiles = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());
      if (filters.folderId !== undefined) {
        params.set('folderId', filters.folderId ?? 'null');
      }
      if (filters.search) params.set('search', filters.search);
      if (filters.type && filters.type !== 'all') params.set('type', filters.type);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

      const response = await apiGet<WorkspaceFilesResponse>(
        `/tenant/workspace/${workspaceId}/files?${params.toString()}`
      );

      setState({
        files: response.files || [],
        folders: response.folders || [],
        breadcrumb: response.breadcrumb || [{ id: null, name: 'Root' }],
        total: response.pagination?.total || 0,
        page: response.pagination?.page || 1,
        totalPages: response.pagination?.totalPages || 0,
        isLoading: false,
        error: null,
        currentFolderId: filters.folderId ?? null,
      });
    } catch (error: any) {
      console.error('Failed to fetch workspace files:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch files',
      }));
    }
  }, [workspaceId, filters]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const setFilters = useCallback((newFilters: UseWorkspaceFilesFilters) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except page itself)
      page: newFilters.page ?? (
        newFilters.search !== undefined ||
        newFilters.type !== undefined ||
        newFilters.folderId !== undefined
          ? 1
          : prev.page
      ),
    }));
  }, []);

  const navigateToFolder = useCallback((folderId: string | null) => {
    setFilters({ folderId, search: '', page: 1 });
  }, [setFilters]);

  const createFolder = useCallback(async (name: string): Promise<FolderItem | null> => {
    try {
      const response = await apiPost<FolderItem>(
        `/tenant/workspace/${workspaceId}/files/folders`,
        { name, parentId: state.currentFolderId }
      );
      await fetchFiles();
      return response;
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }, [workspaceId, state.currentFolderId, fetchFiles]);

  const deleteFolder = useCallback(async (folderId: string): Promise<boolean> => {
    try {
      await apiDelete(`/tenant/workspace/${workspaceId}/files/folders/${folderId}`);
      setState(prev => ({
        ...prev,
        folders: prev.folders.filter(f => f.id !== folderId),
      }));
      return true;
    } catch (error: any) {
      console.error('Failed to delete folder:', error);
      return false;
    }
  }, [workspaceId]);

  const moveFile = useCallback(async (fileId: string, folderId: string | null): Promise<boolean> => {
    try {
      await apiPatch(`/tenant/workspace/${workspaceId}/files/${fileId}/move`, { folderId });
      await fetchFiles();
      return true;
    } catch (error: any) {
      console.error('Failed to move file:', error);
      return false;
    }
  }, [workspaceId, fetchFiles]);

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      await apiDelete(`/tenant/workspace/${workspaceId}/files/${fileId}`);
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
  }, [workspaceId]);

  const batchDeleteFiles = useCallback(async (
    fileIds: string[]
  ): Promise<{ deleted: number; failed: string[] }> => {
    try {
      const response = await apiDelete<{ deleted: number; failed: string[] }>(
        `/tenant/workspace/${workspaceId}/files`,
        { body: JSON.stringify({ fileIds }) }
      );
      await fetchFiles();
      return response;
    } catch (error: any) {
      console.error('Failed to batch delete files:', error);
      return { deleted: 0, failed: fileIds };
    }
  }, [workspaceId, fetchFiles]);

  const getDownloadUrl = useCallback(async (fileId: string): Promise<string | null> => {
    try {
      const response = await apiPost<{ downloadUrl: string; expiresAt: string }>(
        `/tenant/workspace/${workspaceId}/files/${fileId}/download-url`,
        {}
      );
      return response.downloadUrl || null;
    } catch (error: any) {
      console.error('Failed to get download URL:', error);
      return null;
    }
  }, [workspaceId]);

  const getPresignedUploadUrl = useCallback(async (
    fileInfo: { fileName: string; mimeType: string; size: number }
  ): Promise<{ assetId: string; presignedUrl: string } | null> => {
    try {
      const response = await apiPost<{ assetId: string; presignedUrl: string }>(
        `/tenant/workspace/${workspaceId}/files/upload/presigned-url`,
        { ...fileInfo, folderId: state.currentFolderId }
      );
      return response;
    } catch (error: any) {
      console.error('Failed to get presigned upload URL:', error);
      return null;
    }
  }, [workspaceId, state.currentFolderId]);

  return {
    ...state,
    refetch: fetchFiles,
    setFilters,
    navigateToFolder,
    createFolder,
    deleteFolder,
    moveFile,
    deleteFile,
    batchDeleteFiles,
    getDownloadUrl,
    getPresignedUploadUrl,
  };
}
