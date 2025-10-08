import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { routes } from '@/lib/routes';

// Query keys
export const orgKeys = {
  all: ['org'] as const,
  availability: (slug: string) => [...orgKeys.all, 'availability', slug] as const,
};

// Hook to check organization slug availability
export function useOrgAvailability(slug: string, enabled: boolean = true) {
  return useQuery({
    queryKey: orgKeys.availability(slug),
    queryFn: () => apiGet(routes.api.orgAvailability(slug)),
    enabled: enabled && slug.length > 0,
    staleTime: 1000 * 30, // 30 seconds
    retry: false, // Don't retry availability checks
  });
}
