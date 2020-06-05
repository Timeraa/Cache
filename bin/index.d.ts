interface CacheManagerOptions {
    memoryOnly?: boolean;
    checkInterval?: number;
    cacheDirectory: string;
}
export default class CacheManager {
    private internalCache;
    private listeners;
    memoryOnly: boolean;
    cacheDirectory: string;
    defaultExpire: number;
    checkInterval: number;
    constructor(options?: CacheManagerOptions);
    set(name: string, data: any, expires?: number): void;
    get(name: string): any;
    isExpired(name: string): boolean;
    keys(): any;
    values(): any;
    on(event: "update" | "outdated", callback: Function): void;
}
export {};
