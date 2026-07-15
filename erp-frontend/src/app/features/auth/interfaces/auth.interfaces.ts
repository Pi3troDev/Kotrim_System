export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  companyId: string;
  role: string;
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
}
