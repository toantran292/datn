export const routes = {
  login: () => '/login',
  signUp: () => '/sign-up',
  forgotPassword: () => '/forgot-password',
  resetPassword: (token?: string) => `/reset-password${token ? `?token=${token}` : ''}`,
  workspaces: () => '/workspaces',
  workspaceCreate: () => '/workspaces/create',
  inviteAccept: (token: string) => `/invites/${token}`,
  enter: (orgId?: string) => `/enter${orgId ? `?org_id=${orgId}` : ''}`,

  // API routes
  api: {
    googleOAuth: () => 'http://localhost:8080/oauth2/authorization/google',
    emailAuth: () => '/auth/token',
    emailSignUp: () => '/auth/register',
    forgotPassword: () => '/auth/forgot-password',
    resetPassword: () => '/auth/reset-password',
    meTenants: () => '/me/tenants',
    createOrg: () => '/orgs',
    acceptInvite: () => '/tenant/public/invitations/accept',
    orgAvailability: (slug: string) => `/orgs/availability?slug=${slug}`,
  }
} as const;
