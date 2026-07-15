import { createHash } from 'crypto';

/** One-way hash for opaque tokens (e.g. refresh tokens) before persisting them. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
