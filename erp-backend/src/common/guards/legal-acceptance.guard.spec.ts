import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LegalAcceptanceGuard } from './legal-acceptance.guard';
import { LegalAcceptanceService } from '../../modules/legal/legal-acceptance.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Once a newer Terms/Privacy version is published, every non-exempt route
 * must stay locked for a user until they accept it — that is the entire
 * point of `LegalDocumentService.publish` existing. These tests are the
 * enforcement half of that promise; the publish/version-swap logic itself
 * lives in `LegalDocumentService` and is exercised live, since it is a
 * straight Prisma read/write with nothing to unit-test in isolation.
 */

function ctx(user: Partial<AuthenticatedUser> | undefined): ExecutionContext {
  return {
    getHandler: () => (): void => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

const customer: Partial<AuthenticatedUser> = {
  id: 'user-1',
  companyId: 'co-1',
  isSuperAdmin: false,
  impersonatedBy: null,
};

const superAdmin: Partial<AuthenticatedUser> = {
  id: 'staff-1',
  companyId: 'co-kotrim',
  isSuperAdmin: true,
  impersonatedBy: null,
};

const impersonatedSession: Partial<AuthenticatedUser> = {
  id: 'user-1',
  companyId: 'co-1',
  isSuperAdmin: false,
  impersonatedBy: 'staff-1',
};

describe('LegalAcceptanceGuard', () => {
  function build(hasPending: boolean, metaValue?: { public?: boolean; skip?: boolean }) {
    const acceptance = { hasPending: jest.fn().mockResolvedValue(hasPending) } as unknown as LegalAcceptanceService;
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === 'skipLegalCheck') return metaValue?.skip;
        if (key === 'isPublic') return metaValue?.public;
        return undefined;
      }),
    } as unknown as Reflector;
    return { guard: new LegalAcceptanceGuard(reflector, acceptance), acceptance };
  }

  it('lets an unauthenticated request through — JwtAuthGuard already decided this one', async () => {
    const { guard } = build(true);
    await expect(guard.canActivate(ctx(undefined))).resolves.toBe(true);
  });

  it('lets a @Public route through without checking pending acceptance', async () => {
    const { guard, acceptance } = build(true, { public: true });
    await expect(guard.canActivate(ctx(customer))).resolves.toBe(true);
    expect(acceptance.hasPending).not.toHaveBeenCalled();
  });

  it('lets a @SkipLegalCheck route through without checking pending acceptance', async () => {
    const { guard, acceptance } = build(true, { skip: true });
    await expect(guard.canActivate(ctx(customer))).resolves.toBe(true);
    expect(acceptance.hasPending).not.toHaveBeenCalled();
  });

  it('never checks a super-admin — platform staff consent to nothing here', async () => {
    const { guard, acceptance } = build(true);
    await expect(guard.canActivate(ctx(superAdmin))).resolves.toBe(true);
    expect(acceptance.hasPending).not.toHaveBeenCalled();
  });

  it('never checks an impersonated session — consent cannot be given on someone else\'s behalf', async () => {
    const { guard, acceptance } = build(true);
    await expect(guard.canActivate(ctx(impersonatedSession))).resolves.toBe(true);
    expect(acceptance.hasPending).not.toHaveBeenCalled();
  });

  it('allows a customer with nothing pending', async () => {
    const { guard } = build(false);
    await expect(guard.canActivate(ctx(customer))).resolves.toBe(true);
  });

  it('blocks a customer with a pending document, and names the reason', async () => {
    const { guard } = build(true);
    await expect(guard.canActivate(ctx(customer))).rejects.toThrow(ForbiddenException);

    try {
      await guard.canActivate(ctx(customer));
      fail('should have thrown');
    } catch (error) {
      const response = (error as ForbiddenException).getResponse() as { error: string };
      expect(response.error).toBe('LEGAL_ACCEPTANCE_REQUIRED');
    }
  });
});
