import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';

/**
 * The Kotrim mark, carried inside every message.
 *
 * Read from the frontend's brand folder — the same 7 KB asset the site serves,
 * so the e-mail can never drift from the logo everywhere else. Loaded once at
 * module init rather than per send: it is a constant, and reading it 500 times
 * an hour to attach the same bytes would be silly.
 */
export const LOGO_CID = 'kotrim-logo';
export const LOGO_FILENAME = 'kotrim.png';

const LOGO_PATH = join(process.cwd(), '..', 'erp-frontend', 'public', 'brand', 'kotrim-mark-64.png');

function loadLogo(): string | null {
  try {
    return readFileSync(LOGO_PATH).toString('base64');
  } catch {
    // Non-fatal: the header falls back to the wordmark alone, which still reads
    // as Kotrim. A missing file must not stop a password reset from going out.
    new Logger('MailLogo').warn(
      `Logo not found at ${LOGO_PATH} — e-mails will render with the wordmark only.`,
    );
    return null;
  }
}

export const LOGO_BASE64: string | null = loadLogo();
