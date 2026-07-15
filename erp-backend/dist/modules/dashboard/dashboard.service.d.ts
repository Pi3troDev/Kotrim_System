import { PrismaService } from '../../prisma/prisma.service';
import { DashboardSummary } from './interfaces/dashboard-summary.interface';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSummary(companyId: string): Promise<DashboardSummary>;
    private sumIncome;
    private sumExpense;
}
