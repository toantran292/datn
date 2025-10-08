import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { routes } from '@/lib/routes';
import { toast } from '@/lib/toast';
import type { MeTenants, CreateOrgRequest, CreateOrgResponse } from '@/types/identity';

// Query keys
export const tenantsKeys = {
  all: ['tenants'] as const,
  me: () => [...tenantsKeys.all, 'me'] as const,
};

// Hook to fetch user's tenants
export function useTenants() {
  return useQuery({
    queryKey: tenantsKeys.me(),
    queryFn: () => apiGet<MeTenants>(routes.api.meTenants()),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook to create a new organization
export function useCreateOrg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrgRequest) =>
      apiPost<CreateOrgResponse>(routes.api.createOrg(), data),
    onSuccess: () => {
      // Invalidate and refetch tenants
      queryClient.invalidateQueries({ queryKey: tenantsKeys.me() });
      toast.success("Workspace created successfully!");
    },
    onError: (error: Error) => {
      console.error("Failed to create workspace:", error);
      const errorMessage = error.message || "Failed to create workspace";

      // Don't show toast for slug conflicts, let the component handle it
      if (!errorMessage.includes("slug") && !errorMessage.includes("already exists") &&
          !errorMessage.includes("slug_exists") && !errorMessage.includes("slug_invalid")) {
        toast.error(errorMessage);
      }
    },
  });
}

// Hook to accept an invitation
export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => apiPost(routes.api.acceptInvite(), { token, password: "" }),
    onSuccess: () => {
      // Invalidate and refetch tenants to show the new workspace
      queryClient.invalidateQueries({ queryKey: tenantsKeys.me() });
      toast.success("Joined workspace successfully");
    },
    onError: (error: Error) => {
      console.error("Failed to join workspace:", error);
      toast.error("Failed to join workspace");
    },
  });
}
