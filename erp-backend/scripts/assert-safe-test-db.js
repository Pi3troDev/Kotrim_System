/**
 * Refuses to let an automated test run touch a non-development database.
 *
 * Required by every Playwright/verification script before it opens a Prisma
 * client (see scripts/test-db.js, which calls this for you).
 *
 * The check is an **allowlist**, not a blocklist: the connection host must be a
 * known-safe development host. A blocklist ("is it the prod host?") fails open
 * the moment a new production branch appears under a different hostname, which
 * is exactly the case where a mistake is most expensive.
 */

/**
 * Neon host fragments that tests are allowed to write to.
 *
 * Confirmed directly with the user on 2026-07-20: Neon has two branches,
 * named `dev` and `production` in the console. `dev` = ep-muddy-morning,
 * `production` = ep-winter-frost. A prior session's note claiming
 * ep-muddy-morning had been "promoted to production" was wrong — do not
 * revive that story.
 */
const ALLOWED_DB_HOST_FRAGMENTS = ['ep-muddy-morning-acovhqp0'];

/**
 * Hosts known to hold real customer data. Redundant with the allowlist above,
 * but named explicitly so the abort message can say *why* it stopped instead of
 * "host not recognised".
 */
const PRODUCTION_DB_HOST_FRAGMENTS = ['ep-winter-frost-ac0yjdo3'];

function fail(lines) {
  console.error('\n' + '='.repeat(72));
  console.error('ABORTED: unsafe database for an automated test run.');
  console.error('='.repeat(72));
  for (const line of lines) console.error(line);
  console.error('='.repeat(72) + '\n');
  process.exit(1);
}

/**
 * @param {string | undefined} databaseUrl
 * @returns {string} the validated URL
 */
function assertSafeTestDatabase(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    fail([
      'DATABASE_URL is not set.',
      'Tests must load erp-backend/.env.test — run them through `npm run test:e2e:setup`',
      'or require scripts/test-db.js, which loads it for you.',
    ]);
  }

  let host;
  try {
    host = new URL(databaseUrl).host;
  } catch {
    fail([`DATABASE_URL is not a valid URL: ${String(databaseUrl).slice(0, 40)}...`]);
  }

  const isProduction = PRODUCTION_DB_HOST_FRAGMENTS.some((fragment) => host.includes(fragment));
  if (isProduction) {
    fail([
      `DATABASE_URL points at the PRODUCTION database (${host}).`,
      '',
      'This run would have created and deleted records in real customer data.',
      'Point DATABASE_URL at the Neon development branch (see .env.test).',
    ]);
  }

  const isAllowed = ALLOWED_DB_HOST_FRAGMENTS.some((fragment) => host.includes(fragment));
  if (!isAllowed) {
    fail([
      `DATABASE_URL host "${host}" is not on the test allowlist.`,
      '',
      'Tests only run against a known development database. If you added a new',
      'development branch, add its host fragment to ALLOWED_DB_HOST_FRAGMENTS in',
      'erp-backend/scripts/assert-safe-test-db.js.',
    ]);
  }

  return databaseUrl;
}

module.exports = { assertSafeTestDatabase, ALLOWED_DB_HOST_FRAGMENTS, PRODUCTION_DB_HOST_FRAGMENTS };

// Also usable as a standalone preflight: `node scripts/assert-safe-test-db.js`
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.test') });
  const url = assertSafeTestDatabase();
  console.log(`OK: tests will run against ${new URL(url).host}`);
}
