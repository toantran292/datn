import { useQuery } from '@tanstack/react-query';
import type { TPartialProject } from '@uts/types';

export const projectKeys = {
  all: ['projects'] as const,
  list: (workspaceId?: string) => [...projectKeys.all, 'list', workspaceId] as const,
};

interface UseProjectsOptions {
  workspaceId?: string;
  apiBaseUrl?: string;
}

export function useProjects(options?: UseProjectsOptions) {
  const apiBase = `${options?.apiBaseUrl}/pm`;

  return useQuery({
    queryKey: projectKeys.list(options?.workspaceId),
    queryFn: async (): Promise<TPartialProject[]> => {
      const res = await fetch(`${apiBase}/api/projects`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }

      let projects: TPartialProject[] = await res.json();

      // Filter by workspace if specified
      if (options?.workspaceId) {
        projects = projects.filter((p) => {
          // Handle both cases: workspace as string (ID) or workspace as object
          const workspaceId = typeof p.workspace === 'string' ? p.workspace : p.workspace.id;
          return workspaceId === options.workspaceId;
        });
      }

      return projects;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: true, // Always fetch, but filter client-side if workspaceId provided
  });
}
