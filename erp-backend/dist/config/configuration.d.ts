export interface AppConfig {
    env: string;
    port: number;
    apiPrefix: string;
    corsOrigin: string;
    jwt: {
        accessSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
}
declare const _default: () => AppConfig;
export default _default;
