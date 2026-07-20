export interface AuthenticatedUser {
  id: string;
  companyId: string;
  roleId: string;
  roleName: string;
  email: string;
  /** Kotrim platform staff: bypasses the subscription gate, unlocks the admin panel. */
  isSuperAdmin: boolean;
  /**
   * The staff member behind an impersonated session, or null in a normal one.
   *
   * When set, `isSuperAdmin` is forced to false — support looking at a customer's
   * account holds the customer's powers, not their own. Without that, a session
   * meant to *see* what a customer sees would still be able to reach every other
   * tenant, and to start a further impersonation from inside one.
   */
  impersonatedBy?: string | null;
}
