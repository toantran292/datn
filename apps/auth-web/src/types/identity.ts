// Identity types for the auth web app
// These may be imported from @uts/types in the future

export type Org = {
  id: string;
  display_name: string;
  slug: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  logo_url?: string;
};

export type Invite = {
  token: string;
  org_name?: string;
  inviter_email?: string;
  member_type?: "STAFF" | "PARTNER";
};

// Backend response from /orgs/my
export type BackendUserOrg = {
  orgId: string;
  slug: string;
  displayName: string;
  roles: string[];
  memberType: string;
};

export type BackendOrgsResponse = {
  organizations: BackendUserOrg[];
};

// Frontend expected format
export type MeTenants = {
  joined: Org[];
  invites: Invite[];
};

export type CreateOrgRequest = {
  name: string;  // Backend expects 'name', not 'display_name'
  slug: string;
  ownerUserId?: string;  // Optional for backward compatibility
};

export type CreateOrgResponse = {
  id: string;  // Backend returns simple { id: string } format
};

export type EmailAuthRequest = {
  email: string;
  password: string;
};

export type EmailSignUpRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type AuthResponse = {
  success: boolean;
  message?: string;
};
