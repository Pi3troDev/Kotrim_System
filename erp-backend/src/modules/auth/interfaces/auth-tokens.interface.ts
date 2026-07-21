export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Internal only — the DB row id of the new refresh token, used to link rotation via `replacedBy`. */
  refreshTokenId: string;
}

export interface AuthenticatedSession {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    companyId: string;
    role: string;
    /** PlanFeature keys this user's cargo may use — see PlanFeatureGuard. */
    roleAllowedFeatures: string[];
    avatarUrl: string | null;
    isSuperAdmin: boolean;
  };
}

/** Internal service-layer result — includes the raw refresh token so the
 * controller can set it as an httpOnly cookie before stripping it from the
 * response body. Never return this shape directly to a client. */
export type AuthResult = AuthenticatedSession & { refreshToken: string };
