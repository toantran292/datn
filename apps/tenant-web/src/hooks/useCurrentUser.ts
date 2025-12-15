"use client";

import { useAppHeaderContext } from "@uts/design-system/ui";

interface UseCurrentUserReturn {
  userId: string | null;
  orgId: string | null;
  email: string | null;
  roles: string[];
  isLoading: boolean;
  error: unknown;
  isOwner: boolean;
  isAdmin: boolean;
  hasAdminAccess: boolean; // owner OR admin
  isMember: boolean;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const { auth, authLoading, authError } = useAppHeaderContext();

  const roles = auth?.roles || [];
  const isOwner = roles.includes('OWNER');
  const isAdmin = roles.includes('ADMIN');
  const isMember = roles.includes('MEMBER');
  const hasAdminAccess = isOwner || isAdmin;

  return {
    userId: auth?.user_id || null,
    orgId: auth?.org_id || null,
    email: auth?.email || null,
    roles,
    isLoading: authLoading,
    error: authError,
    isOwner,
    isAdmin,
    hasAdminAccess,
    isMember,
  };
}
