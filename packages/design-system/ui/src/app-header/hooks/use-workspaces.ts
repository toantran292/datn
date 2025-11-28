import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IWorkspaceOrg, IWorkspaceTenants } from "@uts/types";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  list: () => [...workspaceKeys.all, "list"] as const,
  me: () => [...workspaceKeys.all, "me"] as const,
};

export interface AuthMeResponse {
  user_id: string;
  org_id: string | null;
  email: string;
  roles: string[];
}

interface UseWorkspacesOptions {
  apiBaseUrl?: string;
}

export function useWorkspaces(options?: UseWorkspacesOptions) {
  const apiBase = options?.apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: async (): Promise<IWorkspaceOrg[]> => {
      const res = await fetch(`${apiBase}/me/tenants`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch workspaces");
      }

      const data: IWorkspaceTenants = await res.json();
      return data.joined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

interface UseWorkspaceSwitchOptions {
  apiBaseUrl?: string;
  onSuccess?: (data: { orgId: string; slug: string }) => void;
  onError?: (error: Error) => void;
}

export function useWorkspaceSwitch(options?: UseWorkspaceSwitchOptions) {
  const apiBase = options?.apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, slug }: { orgId: string; slug: string }) => {
      const res = await fetch(`${apiBase}/auth/switch-org`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ org_id: orgId }),
      });

      if (!res.ok) {
        throw new Error("Failed to switch workspace");
      }

      return { orgId, slug };
    },
    onSuccess: (data) => {
      // Invalidate workspaces query to refetch
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      // Invalidate auth/me query to refetch org_id
      queryClient.invalidateQueries({ queryKey: workspaceKeys.me() });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

interface UseAuthMeOptions {
  apiBaseUrl?: string;
}

export function useAuthMe(options?: UseAuthMeOptions) {
  const apiBase = options?.apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  return useQuery({
    queryKey: workspaceKeys.me(),
    queryFn: async (): Promise<AuthMeResponse> => {
      const res = await fetch(`${apiBase}/auth/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch auth info");
      }

      const data = await res.json();
      return {
        user_id: data.user_id || "",
        org_id: data.org_id || null,
        email: data.email || "",
        roles: data.roles || [],
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}
