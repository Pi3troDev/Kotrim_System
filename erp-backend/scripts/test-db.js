/**
 * The only way a verification/Playwright script should reach the database.
 *
 * Does three things, in this order:
 *   1. Loads erp-backend/.env.test, ignoring whatever DATABASE_URL the shell
 *      may already export.
 *   2. Aborts the process if that database is not a known development one.
 *   3. Hands back a Prisma client plus a tracker that deletes every company the
 *      run created — on success, on failure, and on Ctrl-C.
 *
 * Usage:
 *   const { createTestDb } = require('<...>/erp-backend/scripts/test-db');
 *   const db = await createTestDb();
 *   db.track(companyId);          // after each company you create
 *   ...
 *   await db.cleanup();           // or just let the exit hooks do it
 */
const path = require('path');

const ENV_TEST_PATH = path.join(__dirname, '..', '.env.test');
const PRISMA_CLIENT_PATH = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');

const { assertSafeTestDatabase } = require('./assert-safe-test-db');

async function createTestDb({ quiet = false } = {}) {
  // `override: true` matters: without it, a DATABASE_URL already exported in
  // the shell (e.g. left over from a production task) would win over .env.test
  // and the safety check would be validating the wrong string.
  require('dotenv').config({ path: ENV_TEST_PATH, override: true });

  const databaseUrl = assertSafeTestDatabase();
  if (!quiet) {
    console.log(`[test-db] using ${new URL(databaseUrl).host} (development)`);
  }

  const { PrismaClient } = require(PRISMA_CLIENT_PATH);
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  const trackedCompanyIds = new Set();
  let cleanedUp = false;

  async function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;

    if (trackedCompanyIds.size === 0) {
      await prisma.$disconnect().catch(() => undefined);
      return;
    }

    const ids = [...trackedCompanyIds];
    try {
      // SubscriptionPayment.confirmedBy has no cascade and can point at a user
      // in another tracked company, which would block that company's delete.
      await prisma.subscriptionPayment.updateMany({
        where: { subscription: { companyId: { in: ids } } },
        data: { confirmedById: null },
      });
      // Everything else cascades from Company.
      const { count } = await prisma.company.deleteMany({ where: { id: { in: ids } } });
      if (!quiet) console.log(`[test-db] cleaned up ${count} test company(ies)`);
    } catch (error) {
      // Never mask the real test failure with a cleanup error.
      console.error('[test-db] cleanup failed:', error.message);
    } finally {
      await prisma.$disconnect().catch(() => undefined);
    }
  }

  // Cover the ways a script can end: normal exit, uncaught throw, Ctrl-C.
  // 'exit' cannot await, so it is only a last-resort disconnect.
  process.once('beforeExit', () => void cleanup());
  process.once('SIGINT', async () => {
    await cleanup();
    process.exit(130);
  });
  process.once('uncaughtException', async (error) => {
    console.error(error);
    await cleanup();
    process.exit(1);
  });
  process.once('unhandledRejection', async (error) => {
    console.error(error);
    await cleanup();
    process.exit(1);
  });

  return {
    prisma,
    /** Register a company created by this run so cleanup deletes it. */
    track(companyId) {
      if (companyId) trackedCompanyIds.add(companyId);
      return companyId;
    },
    cleanup,
    databaseUrl,
  };
}

module.exports = { createTestDb };
