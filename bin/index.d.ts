interface CacheManagerOptions {
    memoryOnly?: boolean;
    checkInterval?: number;
    defaultExpire?: number;
    cacheDirectory?: string;
    discardTamperedCache?: boolean;
}
interface CacheListenerOptions {
    only?: string | Array<string>;
}
interface CacheEntry {
    data: {
        [x: string]: any;
    };
    expires: number;
}
export default class CacheManager {
    internalCache: {
        [x: string]: CacheEntry;
    };
    private listeners;
    memoryOnly: boolean;
    cacheDirectory: string;
    defaultExpire: number;
    checkInterval: number;
    discardTamperedCache: boolean;
    constructor(options?: CacheManagerOptions);
    set(name: string, data: any, expires?: number): void;
    get(name: string): {
        [x: string]: any;
    };
    isExpired(name: string): boolean;
    keys(): string[];
    values(): CacheEntry[];
    entires(): [string, CacheEntry][];
    on(event: "update" | "outdated" | "diskCacheUpdate", callback: (name: string, data?: any) => void, options?: CacheListenerOptions): void;
}
export {};
