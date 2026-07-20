export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  companyId: string;
  role: string;
  avatarUrl?: string | null;
  /** Kotrim platform staff: unlocks the admin panel. Not a workshop role. */
  isSuperAdmin?: boolean;
  /** Set while a staff member is viewing this account as support. */
  impersonatedBy?: string | null;
}

export interface AuthSession {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterCompanyPayload {
  companyName: string;
  companyDocument: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  /** Omitted = TRIAL. SUBSCRIBE creates a PENDING subscription with no trial. */
  intent?: 'TRIAL' | 'SUBSCRIBE';
  /** Plan chosen on the pricing page. Only meaningful with intent SUBSCRIBE. */
  planSlug?: string;
  /** Must be true — the backend rejects registration otherwise. */
  acceptedTerms: boolean;
}
