export const routes = {
  login: () => '/login',
  workspaces: () => '/workspaces',
  workspaceCreate: () => '/workspaces/create',
  inviteAccept: (token: string) => `/invites/${token}`,
  enter: (orgId?: string) => `/enter${orgId ? `?org_id=${orgId}` : ''}`,

  // API routes
  api: {
    googleOAuth: () => '/auth/oidc/google',
    emailAuth: () => '/auth/token',
    meTenants: () => '/me/tenants',
    createTenant: () => '/tenants',
    acceptInvite: (token: string) => `/invites/${token}/accept`,
    orgAvailability: (slug: string) => `/orgs/availability?slug=${slug}`,
  }
} as const;
