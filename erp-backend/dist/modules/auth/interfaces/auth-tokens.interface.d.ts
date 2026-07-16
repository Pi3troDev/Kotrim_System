export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
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
    };
}
export type AuthResult = AuthenticatedSession & {
    refreshToken: string;
};
