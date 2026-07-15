export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedSession {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    companyId: string;
    role: string;
  };
}

/** Internal service-layer result — includes the raw refresh token so the
 * controller can set it as an httpOnly cookie before stripping it from the
 * response body. Never return this shape directly to a client. */
export type AuthResult = AuthenticatedSession & { refreshToken: string };
