import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ImpersonationReadOnlyGuard } from './impersonation-readonly.guard';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * A support session may look. It may not touch.
 *
 * Every write it lets through would land in a real workshop's books under that
 * workshop's own name, with only an audit row to explain it afterwards.
 */

function ctx(method: string, path: string, user?: Partial<AuthenticatedUser>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ method, path, user }) }),
  } as unknown as ExecutionContext;
}

const customer: Partial<AuthenticatedUser> = {
  id: 'user-1',
  companyId: 'co-1',
  isSuperAdmin: false,
  impersonatedBy: null,
};

const impersonated: Partial<AuthenticatedUser> = {
  id: 'user-1',
  companyId: 'co-1',
  isSuperAdmin: false,
  impersonatedBy: 'staff-9',
};

describe('ImpersonationReadOnlyGuard', () => {
  const guard = new ImpersonationReadOnlyGuard();

  describe('a normal session is untouched', () => {
    it.each(['GET', 'POST', 'PATCH', 'PUT', 'DELETE'])('allows %s', (method) => {
      expect(guard.canActivate(ctx(method, '/api/v1/clients', customer))).toBe(true);
    });

    it('allows an anonymous request through to the guards that care', () => {
      expect(guard.canActivate(ctx('POST', '/api/v1/auth/login', undefined))).toBe(true);
    });
  });

  describe('an impersonated session', () => {
    it.each(['GET', 'HEAD', 'OPTIONS'])('may read: %s', (method) => {
      expect(guard.canActivate(ctx(method, '/api/v1/clients', impersonated))).toBe(true);
    });

    it.each([
      ['POST', '/api/v1/clients'],
      ['PATCH', '/api/v1/clients/abc'],
      ['PUT', '/api/v1/vehicles/abc'],
      ['DELETE', '/api/v1/work-orders/abc'],
      ['POST', '/api/v1/settings/company/logo'],
      ['PATCH', '/api/v1/users/me'],
    ])('may not write: %s %s', (method, path) => {
      expect(() => guard.canActivate(ctx(method, path, impersonated))).toThrow(ForbiddenException);
    });

    it('explains itself with a code the frontend can act on', () => {
      try {
        guard.canActivate(ctx('POST', '/api/v1/clients', impersonated));
        fail('should have thrown');
      } catch (error) {
        const response = (error as ForbiddenException).getResponse() as { error: string };
        expect(response.error).toBe('IMPERSONATION_READ_ONLY');
      }
    });
  });

  describe('the two writes it must always allow', () => {
    // Without these, a support session could not be left — only waited out.
    it('may end the impersonation', () => {
      expect(guard.canActivate(ctx('POST', '/api/v1/admin/impersonate/end', impersonated))).toBe(true);
    });

    it('may log out', () => {
      expect(guard.canActivate(ctx('POST', '/api/v1/auth/logout', impersonated))).toBe(true);
    });
  });

  describe('the exempt paths are matched by suffix, not by containment', () => {
    it('does not let a crafted path smuggle a write past the exemption', () => {
      // A path merely *containing* the exempt string must not pass — otherwise
      // /clients/auth/logout/../../delete would be a way through.
      expect(() =>
        guard.canActivate(ctx('POST', '/api/v1/auth/logout/something-else', impersonated)),
      ).toThrow(ForbiddenException);
    });
  });
});
