export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  /** Public base URL of the frontend — used to build links in outgoing e-mails. */
  appUrl: string;
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
  mail: {
    /** 'resend' delivers; 'console' logs and sends nothing. */
    provider: 'resend' | 'console';
    resendApiKey: string;
    /** The From header, e.g. "Kotrim <nao-responda@kotrim.com.br>". */
    from: string;
    /**
     * When set, every message goes here instead of the real recipient, with the
     * intended address stamped into the body. The safety net that stops a dev
     * box from mailing real customers — and, until kotrim.com.br is verified in
     * Resend, the only address Resend will accept at all.
     */
    redirectTo: string;
    /** Blind-copied on the templates flagged in STAFF_NOTIFIED_TEMPLATES. */
    staffNotifyTo: string;
  };
  billing: {
    /** Length of the free trial granted to every newly registered company. */
    trialDurationDays: number;
    /** Shown to a workshop as the Pix destination while billing is manual. */
    pixKey: string;
    /** Where a workshop sends proof of payment while billing is manual. */
    contact: string;
  };
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  appUrl: process.env.APP_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET as string,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
  mail: {
    // Defaults to resend when a key exists, console otherwise — a fresh clone
    // with no key boots and logs instead of blowing up.
    provider: (process.env.MAIL_PROVIDER as 'resend' | 'console') ?? (process.env.RESEND_API_KEY ? 'resend' : 'console'),
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.MAIL_FROM ?? 'Kotrim <onboarding@resend.dev>',
    redirectTo: process.env.MAIL_REDIRECT_TO ?? '',
    staffNotifyTo: process.env.MAIL_STAFF_NOTIFY_TO ?? '',
  },
  billing: {
    trialDurationDays: parseInt(process.env.TRIAL_DURATION_DAYS ?? '7', 10),
    pixKey: process.env.BILLING_PIX_KEY ?? '',
    contact: process.env.BILLING_CONTACT ?? '',
  },
});
