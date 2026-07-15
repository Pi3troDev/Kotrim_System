export interface JwtPayload {
  sub: string; // user id
  companyId: string;
  roleId: string;
  email: string;
}
