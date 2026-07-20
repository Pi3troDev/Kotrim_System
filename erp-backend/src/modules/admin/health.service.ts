import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ServiceState = 'up' | 'degraded' | 'down';

export interface ServiceHealth {
  name: string;
  state: ServiceState;
  detail: string;
  /** Round-trip in ms, where measuring one makes sense. */
  latencyMs?: number;
}

export interface RecentError {
  at: string;
  source: string;
  message: string;
  context: string | null;
}

export interface SystemHealth {
  version: string;
  environment: string;
  /** Seconds since this process started. */
  uptimeSeconds: number;
  nodeVersion: string;
  services: ServiceHealth[];
  recentErrors: RecentError[];
  /** Non-null once a queue exists. Today the only async work is a nightly cron. */
  queues: null;
  scheduledJobs: { name: string; schedule: string; timezone: string }[];
  memory: { usedMb: number; totalMb: number };
}

/**
 * What an administrator needs to answer "is it working?".
 *
 * Every value here is measured, not declared. A page that reports "up" because
 * a constant says so is worse than no page: it converts an outage into
 * confusion.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getHealth(): Promise<SystemHealth> {
    const [database, mail] = await Promise.all([this.checkDatabase(), this.checkMail()]);
    const memory = process.memoryUsage();

    return {
      // Read from package.json at build time via the env Nest exposes; falls
      // back rather than pretending to a version it cannot prove.
      version: process.env.npm_package_version ?? '0.0.1',
      environment: this.configService.get<string>('env') ?? 'unknown',
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      services: [database, mail],
      recentErrors: await this.recentErrors(),
      queues: null,
      scheduledJobs: [
        {
          name: 'Tarefas diárias (recorrências, avisos de vencimento, varredura de assinaturas)',
          schedule: '03:00',
          timezone: 'America/Sao_Paulo',
        },
      ],
      memory: {
        usedMb: Math.round(memory.heapUsed / 1024 / 1024),
        totalMb: Math.round(memory.heapTotal / 1024 / 1024),
      },
    };
  }

  /** Actually asks the database, and times it. */
  private async checkDatabase(): Promise<ServiceHealth> {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - started;

      return {
        name: 'Banco de dados',
        // Neon is serverless and sleeps; a cold start is slow but healthy.
        // Calling that "down" would cry wolf every morning.
        state: latencyMs > 2000 ? 'degraded' : 'up',
        detail: latencyMs > 2000 ? 'Respondendo devagar' : 'Conectado',
        latencyMs,
      };
    } catch (error: unknown) {
      return {
        name: 'Banco de dados',
        state: 'down',
        detail: error instanceof Error ? error.message.slice(0, 120) : 'Sem conexão',
        latencyMs: Date.now() - started,
      };
    }
  }

  /**
   * Mail health is measured by what actually happened, not by pinging Resend.
   *
   * A provider that answers a ping while rejecting every send is "up" by any
   * naive check. The failure rate over the last day is the thing that would
   * really be wrong.
   */
  private async checkMail(): Promise<ServiceHealth> {
    const provider = this.configService.get<string>('mail.provider');
    const redirectTo = this.configService.get<string>('mail.redirectTo');
    const since = new Date(Date.now() - MS_PER_DAY);

    if (provider !== 'resend') {
      return {
        name: 'E-mail',
        state: 'degraded',
        detail: 'Provedor "console" — mensagens são registradas, não enviadas',
      };
    }

    const [sent, failed] = await Promise.all([
      this.prisma.mailLog.count({
        where: { createdAt: { gte: since }, status: { in: [MailStatus.SENT, MailStatus.RESENT] } },
      }),
      this.prisma.mailLog.count({ where: { createdAt: { gte: since }, status: MailStatus.FAILED } }),
    ]);

    if (redirectTo) {
      return {
        name: 'E-mail',
        state: 'degraded',
        detail: `Redirecionamento ativo — tudo vai para ${redirectTo}, nada chega ao cliente`,
      };
    }

    const total = sent + failed;
    if (total === 0) {
      return { name: 'E-mail', state: 'up', detail: 'Resend — sem envios nas últimas 24h' };
    }

    const failureRate = failed / total;
    return {
      name: 'E-mail',
      state: failureRate > 0.2 ? 'down' : failureRate > 0 ? 'degraded' : 'up',
      detail: `Resend — ${sent} enviados, ${failed} falharam nas últimas 24h`,
    };
  }

  /**
   * Recent failures worth an administrator's attention.
   *
   * Drawn from the two tables that already record them: mail that did not send,
   * and audited actions that did not succeed. There is no application-wide error
   * store — inventing one here, unread by anything else, would be worse than
   * saying so.
   */
  private async recentErrors(): Promise<RecentError[]> {
    const since = new Date(Date.now() - 7 * MS_PER_DAY);

    const [failedMail, failedActions] = await Promise.all([
      this.prisma.mailLog.findMany({
        where: { status: MailStatus.FAILED, createdAt: { gte: since } },
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.auditLog.findMany({
        where: { result: 'FAILURE', createdAt: { gte: since } },
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const errors: RecentError[] = [
      ...failedMail.map((log) => ({
        at: log.createdAt.toISOString(),
        source: 'E-mail',
        message: log.error ?? `Falha ao enviar "${log.subject}"`,
        context: log.company?.name ?? log.to,
      })),
      ...failedActions.map((log) => ({
        at: log.createdAt.toISOString(),
        source: String(log.action),
        message: JSON.stringify(log.changes ?? {}).slice(0, 160),
        context: log.company?.name ?? log.ipAddress,
      })),
    ];

    return errors.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  }
}
