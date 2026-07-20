/**
 * One-off cleanup of automated-test data from the production database.
 * Throwaway: deleted after this run. Not part of the codebase.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Confirmed with the user: the only company with real, hand-entered data.
const KEEP_EMAILS = ['joao@teste.com'];

(async () => {
  const keepUsers = await prisma.user.findMany({
    where: { email: { in: KEEP_EMAILS } },
    select: { companyId: true, email: true },
  });

  if (keepUsers.length !== KEEP_EMAILS.length) {
    throw new Error(`Refusing to run: expected to find ${KEEP_EMAILS.length} keep-account(s), found ${keepUsers.length}.`);
  }

  const keepCompanyIds = keepUsers.map((u) => u.companyId);
  console.log('Preserving companies:', keepCompanyIds, keepUsers.map((u) => u.email));

  const doomed = await prisma.company.findMany({
    where: { id: { notIn: keepCompanyIds } },
    select: { id: true, name: true },
  });

  console.log(`\nAbout to delete ${doomed.length} companies and everything under them.`);

  // SubscriptionPayment.confirmedBy has no cascade, so a staff user who
  // confirmed a payment would block their own company's delete. Null it first.
  const unlinked = await prisma.subscriptionPayment.updateMany({
    where: { confirmedById: { not: null } },
    data: { confirmedById: null },
  });
  console.log(`Unlinked confirmedBy on ${unlinked.count} payment(s).`);

  // Everything else hangs off Company with onDelete: Cascade.
  const result = await prisma.company.deleteMany({ where: { id: { notIn: keepCompanyIds } } });
  console.log(`Deleted ${result.count} companies.`);

  console.log('\n=== remaining ===');
  for (const m of ['company', 'user', 'subscription', 'subscriptionPayment', 'role', 'client', 'vehicle', 'workOrder', 'inventoryItem', 'expense', 'income', 'appointment', 'employee', 'account', 'category', 'supplier', 'notification', 'plan']) {
    console.log(' ', m, await prisma[m].count());
  }

  const survivors = await prisma.company.findMany({ include: { users: { select: { email: true } } } });
  console.log('\nSurviving companies:');
  for (const c of survivors) console.log(` - ${c.name} | ${c.users.map((u) => u.email).join(',')}`);

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
