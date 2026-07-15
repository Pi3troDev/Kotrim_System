export interface HealthStatus {
    status: 'ok';
    timestamp: string;
}
export declare class AppService {
    getHealth(): HealthStatus;
}
