import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DashboardService } from './dashboard.service';
import { DashboardSummary } from './interfaces/dashboard-summary.interface';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(user: AuthenticatedUser): Promise<DashboardSummary>;
}
