/**
 * One-time bootstrap of a Kotrim platform super-admin.
 *
 *   npm run superadmin:init            # development branch
 *   npm run superadmin:init:prod       # production
 *   npm run superadmin:init -- outro@email.com
 *
 * Idempotent and safe to re-run:
 *   - account missing  -> creates it, with NO password
 *   - account exists   -> promotes it to super-admin, password untouched
 *   - password not set -> prints a fresh single-use setup link (burns the old)
 *   - password already set -> promotes and stops; it will not hand out a link
 *     that could hijack a live account
 *
 * Authority comes only from `User.isSuperAdmin`. The email is an identifier for
 * this script and nothing more — change it later and access follows the flag.
 */
import { PasswordTokenPurpose, PrismaClient, SubscriptionStatus } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

const prisma = new PrismaClient();

const DEFAULT_EMAIL = 'pietroalv2511@gmail.com';
const SETUP_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** The tenant that Kotrim staff accounts belong to. Not a customer workshop. */
const PLATFORM_COMPANY_NAME = 'Kotrim (Plataforma)';
const PLATFORM_COMPANY_DOCUMENT = '00.000.000/0001-00';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function resolvePlatformCompany() {
  const existing = await prisma.company.findUnique({ where: { document: PLATFORM_COMPANY_DOCUMENT } });
  if (existing) return existing;

  return prisma.company.create({
    data: {
      name: PLATFORM_COMPANY_NAME,
      document: PLATFORM_COMPANY_DOCUMENT,
      // Staff bypass SubscriptionGuard anyway, but a company with no
      // subscription row is an odd shape that the admin panel would render as
      // "—". Give it a real, non-expiring one.
      subscription: {
        create: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date('2099-12-31'),
        },
      },
    },
  });
}

async function main(): Promise<void> {
  const email = (process.argv[2] ?? DEFAULT_EMAIL).toLowerCase().trim();
  const host = new URL(process.env.DATABASE_URL ?? 'postgres://unknown').host;

  console.log(`\nDatabase: ${host}`);
  console.log(`Account:  ${email}\n`);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const company = await resolvePlatformCompany();
    const role = await prisma.role.upsert({
      where: { companyId_name: { companyId: company.id, name: 'Admin' } },
      create: {
        companyId: company.id,
        name: 'Admin',
        description: 'Kotrim platform staff',
        isSystem: true,
      },
      update: {},
    });

    user = await prisma.user.create({
      data: {
        companyId: company.id,
        roleId: role.id,
        name: 'Pietro Alves',
        email,
        // No password on purpose — the account is unusable until the setup
        // link below is redeemed.
        passwordHash: null,
        isSuperAdmin: true,
      },
    });
    console.log('Created a new super-admin account (no password set).');
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isSuperAdmin: true, isActive: true, deletedAt: null },
    });
    console.log('Account already existed — promoted to super-admin.');
  }

  if (user.passwordInitializedAt) {
    console.log('\nThis account already has a password. Nothing else to do.');
    console.log('Log in normally. (Use the "forgot my password" flow if you need a new one.)');
    console.log('No setup link was issued: handing one out for an initialized account');
    console.log('would be a way to take it over.\n');
    return;
  }

  // Mirrors PasswordTokenService.issue(): burn any outstanding link, store only
  // the hash. Duplicated here rather than importing the Nest service, because
  // booting the DI container for a one-shot script is not worth it — but the
  // token semantics must stay identical.
  const token = randomBytes(48).toString('base64url');
  await prisma.passwordToken.updateMany({
    where: { userId: user.id, purpose: PasswordTokenPurpose.SETUP, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.passwordToken.create({
    data: {
      userId: user.id,
      purpose: PasswordTokenPurpose.SETUP,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + SETUP_TOKEN_TTL_MS),
    },
  });

  const appUrl = process.env.APP_URL ?? 'http://localhost:4200';
  console.log('\n' + '='.repeat(72));
  console.log('ONE-TIME SETUP LINK — valid for 24h, works once, do not share:');
  console.log('='.repeat(72));
  console.log(`\n${appUrl}/auth/create-password?token=${token}\n`);
  console.log('='.repeat(72));
  console.log('Open it to choose your password. After that, log in normally and');
  console.log('this link stops working. Re-run this script to issue a new one.\n');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
