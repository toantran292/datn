// Identity types for the auth web app
// These may be imported from @uts/types in the future

export type Org = {
  id: string;
  display_name: string;
  slug: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

export type Invite = {
  token: string;
  org_name?: string;
  inviter_email?: string;
  member_type?: "STAFF" | "PARTNER";
};

export type MeTenants = {
  joined: Org[];
  invites: Invite[];
};

export type CreateTenantRequest = {
  display_name: string;
  slug: string;
};

export type CreateTenantResponse = {
  id: string;
  display_name: string;
  slug: string;
  role: string;
};

export type EmailAuthRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  success: boolean;
  message?: string;
};
