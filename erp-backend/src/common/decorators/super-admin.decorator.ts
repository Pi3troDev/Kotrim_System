import { SetMetadata } from '@nestjs/common';

export const IS_SUPER_ADMIN_KEY = 'isSuperAdmin';

/**
 * Restricts a route to Kotrim platform staff (`User.isSuperAdmin`).
 *
 * Distinct from `@Roles('Admin')`, which means "administrator *of a workshop*"
 * and is still scoped to a single tenant. This one crosses tenants.
 */
export const SuperAdmin = (): MethodDecorator & ClassDecorator => SetMetadata(IS_SUPER_ADMIN_KEY, true);
