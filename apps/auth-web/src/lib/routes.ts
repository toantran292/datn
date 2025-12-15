export const routes = {
  login: () => '/login',
  signUp: () => '/sign-up',
  forgotPassword: () => '/forgot-password',
  resetPassword: (token?: string) => `/reset-password${token ? `?token=${token}` : ''}`,
  verifyEmail: (token?: string) => `/verify-email${token ? `?token=${token}` : ''}`,
  checkEmail: (email?: string) => `/check-email${email ? `?email=${encodeURIComponent(email)}` : ''}`,
  linkGoogle: () => '/link-google',
  workspaces: () => '/workspaces',
  workspaceCreate: () => '/workspaces/create',
  inviteAccept: (token: string) => `/invites/${token}`,
  enter: (orgId?: string) => `/enter${orgId ? `?org_id=${orgId}` : ''}`,

  // Account routes
  account: () => '/account',
  accountProfile: () => '/account/profile',
  accountSecurity: () => '/account/security',

  // API routes
  api: {
    googleOAuth: () => 'http://localhost:8080/oauth2/authorization/google',
    linkGoogleAccount: () => 'http://localhost:8080/oauth2/authorization/google?mode=link',
    emailAuth: () => '/auth/token',
    emailSignUp: () => '/auth/register',
    forgotPassword: () => '/auth/forgot-password',
    resetPassword: () => '/auth/reset-password',
    verifyEmail: () => '/auth/verify-email',
    resendVerification: () => '/auth/resend-verification',
    meTenants: () => '/me/tenants',
    createOrg: () => '/orgs',
    acceptInvite: () => '/tenant/public/invitations/accept',
    orgAvailability: (slug: string) => `/orgs/availability?slug=${slug}`,
    orgLogoPresignedUrl: (orgId: string) => `/orgs/${orgId}/logo/presigned-url`,
    orgLogo: (orgId: string) => `/orgs/${orgId}/logo`,
    fileStorageConfirmUpload: () => '/files/confirm-upload',
    // Account API
    updateProfile: () => '/me/profile',
    avatarPresignedUrl: () => '/me/avatar/presigned-url',
    updateAvatar: () => '/me/avatar',
    changePassword: () => '/auth/password/change',
    logout: () => '/auth/logout',
    // Link Google with password verification
    linkGoogleWithPassword: () => '/auth/link-google',
  }
} as const;
