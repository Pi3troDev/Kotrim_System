import { BillingInterval, PrismaClient, SubscriptionStatus } from '@prisma/client';
import { seedLegalDocuments } from './seed-legal-documents';

const prisma = new PrismaClient();

const TRIAL_DURATION_DAYS = parseInt(process.env.TRIAL_DURATION_DAYS ?? '7', 10);

/**
 * The public plan catalogue. Upserted by slug so re-running the seed edits
 * prices and copy in place instead of orphaning the plans that live
 * subscriptions already point at.
 */
const PLANS = [
  {
    slug: 'essencial',
    name: 'Essencial',
    description: 'Para oficinas que estão começando a organizar a operação.',
    priceCents: 9900,
    interval: BillingInterval.MONTHLY,
    maxUsers: 3,
    sortOrder: 1,
    features: [
      'Clientes e veículos ilimitados',
      'Ordens de serviço e agenda',
      'Até 3 funcionários',
      'Até 3 usuários',
      'Suporte por e-mail',
    ],
  },
  {
    slug: 'profissional',
    name: 'Profissional',
    description: 'A oficina completa: estoque, financeiro e relatórios.',
    priceCents: 19900,
    interval: BillingInterval.MONTHLY,
    maxUsers: 10,
    sortOrder: 2,
    features: [
      'Tudo do Essencial',
      'Controle de estoque',
      'Financeiro completo',
      'Relatórios gerenciais',
      'Até 10 funcionários',
      'Até 10 usuários',
      'Suporte prioritário',
    ],
  },
  {
    slug: 'oficina-plus',
    name: 'Oficina Plus',
    description: 'Para operações maiores, sem limite de equipe.',
    priceCents: 34900,
    interval: BillingInterval.MONTHLY,
    maxUsers: null,
    sortOrder: 3,
    features: [
      'Tudo do Profissional',
      'Funcionários ilimitados',
      'Usuários ilimitados',
      'Relatórios avançados',
      'Suporte dedicado',
    ],
  },
];

/**
 * Companies that existed before billing did have no subscription row, and
 * SubscriptionGuard reads "no subscription" as "no access" — so without this
 * every pre-existing workshop would be locked out the moment billing ships.
 * Gives them a fresh trial to land on.
 */
async function backfillMissingSubscriptions(): Promise<void> {
  const companies = await prisma.company.findMany({
    where: { deletedAt: null, subscription: { is: null } },
    select: { id: true, name: true },
  });

  if (companies.length === 0) {
    console.log('No companies missing a subscription.');
    return;
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.subscription.createMany({
    data: companies.map((company) => ({
      companyId: company.id,
      status: SubscriptionStatus.TRIAL,
      trialEndsAt,
    })),
  });

  console.log(`Backfilled trial subscriptions for ${companies.length} pre-existing company(ies).`);
}

/**
 * Users that predate `passwordInitializedAt` have a password but a null stamp,
 * which is the exact shape that marks an account as claimable through a SETUP
 * link. Backfilling closes that off for every pre-existing account.
 */
async function backfillPasswordInitializedAt(): Promise<void> {
  const { count } = await prisma.user.updateMany({
    where: { passwordHash: { not: null }, passwordInitializedAt: null },
    data: { passwordInitializedAt: new Date() },
  });
  console.log(
    count === 0
      ? 'No users needed a passwordInitializedAt backfill.'
      : `Backfilled passwordInitializedAt for ${count} pre-existing user(s).`,
  );
}

async function main(): Promise<void> {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: plan,
    });
    console.log(`Plan seeded: ${plan.slug}`);
  }

  await backfillMissingSubscriptions();
  await backfillPasswordInitializedAt();
  await seedLegalDocuments(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
