import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPatch, apiPost, apiDelete } from '@/lib/api';

export interface OrgSettings {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseOrgSettingsState {
  settings: OrgSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface UseOrgSettingsReturn extends UseOrgSettingsState {
  refetch: () => Promise<void>;
  updateSettings: (data: { name?: string; description?: string }) => Promise<boolean>;
  uploadLogo: (file: File) => Promise<boolean>;
  deleteLogo: () => Promise<boolean>;
  deleteOrganization: () => Promise<boolean>;
}

export function useOrgSettings(): UseOrgSettingsReturn {
  const [state, setState] = useState<UseOrgSettingsState>({
    settings: null,
    isLoading: true,
    isSaving: false,
    error: null,
  });

  const fetchSettings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await apiGet<OrgSettings>('/tenant/settings');
      setState({ settings: response, isLoading: false, isSaving: false, error: null });
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      setState({
        settings: null,
        isLoading: false,
        isSaving: false,
        error: error.message || 'Failed to fetch settings',
      });
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (data: { name?: string; description?: string }): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }));
      const response = await apiPatch<OrgSettings>('/tenant/settings', data);
      setState(prev => ({
        ...prev,
        settings: response,
        isSaving: false,
      }));
      return true;
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message || 'Failed to update settings',
      }));
      return false;
    }
  }, []);

  const uploadLogo = useCallback(async (file: File): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }));

      // Step 1: Get presigned URL from file-storage via tenant-bff
      const presignedRes = await apiPost<{
        assetId: string;
        presignedUrl: string;
      }>('/tenant/settings/logo/presigned-url', {
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      });

      const { assetId, presignedUrl } = presignedRes;

      // Step 2: Upload file directly to S3/MinIO
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Step 3: Confirm upload and update org logo
      const response = await apiPost<OrgSettings>('/tenant/settings/logo/confirm', {
        assetId,
      });

      setState(prev => ({
        ...prev,
        settings: response,
        isSaving: false,
      }));
      return true;
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message || 'Failed to upload logo',
      }));
      return false;
    }
  }, []);

  const deleteLogo = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }));
      await apiDelete('/tenant/settings/logo');
      setState(prev => ({
        ...prev,
        settings: prev.settings ? { ...prev.settings, logoUrl: undefined } : null,
        isSaving: false,
      }));
      return true;
    } catch (error: any) {
      console.error('Failed to delete logo:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message || 'Failed to delete logo',
      }));
      return false;
    }
  }, []);

  const deleteOrganization = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }));
      await apiDelete('/tenant/settings/organization');
      return true;
    } catch (error: any) {
      console.error('Failed to delete organization:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message || 'Failed to delete organization',
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    refetch: fetchSettings,
    updateSettings,
    uploadLogo,
    deleteLogo,
    deleteOrganization,
  };
}
