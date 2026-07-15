import { AppService } from './app.service';
import type { HealthStatus } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHealth(): HealthStatus;
}
