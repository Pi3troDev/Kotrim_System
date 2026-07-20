export interface JwtPayload {
  sub: string; // user id
  companyId: string;
  roleId: string;
  email: string;
  /**
   * Set only on an impersonation token: the id of the Kotrim staff member
   * actually behind the session.
   *
   * Its presence is what makes the session an impersonation. The strategy reads
   * it to force `isSuperAdmin` off and to stamp audit rows with who was really
   * there — an action taken while impersonating must never look like one the
   * customer took themselves.
   */
  impersonatedBy?: string;
}
