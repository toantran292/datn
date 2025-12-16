"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export interface Project {
  id: string;
  orgId: string;
  identifier: string;
  name: string;
  description: string | null;
  projectLead: string | null;
  defaultAssignee: string | null;
  createdAt: string;
  updatedAt: string;
  sprintIds?: string[];
}

export interface ProjectLite {
  id: string;
  identifier: string;
  name: string;
  description: string | null;
  orgId: string;
  projectLead: string | null;
  issueCount?: number;
  sprintCount?: number;
}

export interface CreateProjectData {
  name: string;
  identifier?: string;
  description?: string;
  projectLead?: string;
  defaultAssignee?: string;
}

export interface UpdateProjectData {
  name?: string;
  projectLead?: string;
  defaultAssignee?: string;
}

interface UseProjectsState {
  projects: ProjectLite[];
  isLoading: boolean;
  error: string | null;
}

interface UseProjectsReturn extends UseProjectsState {
  refetch: () => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project | null>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  checkIdentifier: (identifier: string) => Promise<boolean>;
  getProject: (id: string) => Promise<Project | null>;
}

export function useProjects(): UseProjectsReturn {
  const [state, setState] = useState<UseProjectsState>({
    projects: [],
    isLoading: true,
    error: null,
  });

  const fetchProjects = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const projects = await apiGet<ProjectLite[]>('/pm/api/projects');
      setState({ projects, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      setState({
        projects: [],
        isLoading: false,
        error: error.message || 'Failed to fetch projects',
      });
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(async (data: CreateProjectData): Promise<Project | null> => {
    try {
      const project = await apiPost<Project>('/pm/api/projects', data);
      await fetchProjects();
      return project;
    } catch (error: any) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [fetchProjects]);

  const updateProject = useCallback(async (id: string, data: UpdateProjectData): Promise<Project | null> => {
    try {
      const project = await apiPut<Project>(`/pm/api/projects/${id}`, data);
      await fetchProjects();
      return project;
    } catch (error: any) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }, [fetchProjects]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiDelete(`/pm/api/projects/${id}`);
      await fetchProjects();
      return true;
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }, [fetchProjects]);

  const checkIdentifier = useCallback(async (identifier: string): Promise<boolean> => {
    try {
      const result = await apiGet<{ identifier: string; available: boolean }>(
        `/pm/api/projects/check-identifier?identifier=${encodeURIComponent(identifier)}`
      );
      return result.available;
    } catch (error: any) {
      console.error('Failed to check identifier:', error);
      return false;
    }
  }, []);

  const getProject = useCallback(async (id: string): Promise<Project | null> => {
    try {
      return await apiGet<Project>(`/pm/api/projects/${id}`);
    } catch (error: any) {
      console.error('Failed to get project:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    checkIdentifier,
    getProject,
  };
}
