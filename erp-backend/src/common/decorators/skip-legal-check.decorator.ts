import { SetMetadata } from '@nestjs/common';

export const SKIP_LEGAL_CHECK_KEY = 'skipLegalCheck';

/**
 * Exempts a route from `LegalAcceptanceGuard`.
 *
 * Reserved for the routes a company with pending re-acceptance still needs:
 * reading the current documents, seeing what is pending, accepting it, and
 * logging out. Everything else stays locked until acceptance is recorded.
 */
export const SkipLegalCheck = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_LEGAL_CHECK_KEY, true);
