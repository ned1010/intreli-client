'use client';

/**
 * Cache utility module for localStorage with TTL support
 * Provides safe localStorage access with error handling and expiration
 */

const CACHE_VERSION = '1.0.0';
const MAX_CACHE_SIZE = 50; // Maximum number of cache entries

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    version: string;
}

export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
    version?: string; // Cache version for invalidation
    maxSize?: number; // Maximum cache entries
}

/**
 * Safe localStorage wrapper with error handling
 */
class LocalStorageCache {
    private prefix: string;
    private defaultTTL: number;
    private defaultVersion: string;

    constructor(prefix: string = 'doc-autocomplete', defaultTTL: number = 5 * 60 * 1000) {
        this.prefix = prefix;
        this.defaultTTL = defaultTTL;
        this.defaultVersion = CACHE_VERSION;
    }

    /**
     * Check if localStorage is available
     */
    private isAvailable(): boolean {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get cache key with prefix
     */
    private getKey(key: string): string {
        return `${this.prefix}-${key}`;
    }

    /**
     * Get value from cache
     */
    get<T>(key: string, options?: CacheOptions): T | null {
        if (!this.isAvailable()) {
            return null;
        }

        try {
            const cacheKey = this.getKey(key);
            const cached = localStorage.getItem(cacheKey);

            if (!cached) {
                return null;
            }

            const entry: CacheEntry<T> = JSON.parse(cached);
            const ttl = options?.ttl || this.defaultTTL;
            const version = options?.version || this.defaultVersion;

            // Check version mismatch
            if (entry.version !== version) {
                this.remove(key);
                return null;
            }

            // Check expiration
            const now = Date.now();
            if (now - entry.timestamp > ttl) {
                this.remove(key);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.warn('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set value in cache
     */
    set<T>(key: string, data: T, options?: CacheOptions): boolean {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const cacheKey = this.getKey(key);
            const version = options?.version || this.defaultVersion;

            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                version
            };

            localStorage.setItem(cacheKey, JSON.stringify(entry));
            return true;
        } catch (error) {
            console.warn('Cache set error:', error);
            // Try to clear old entries if quota exceeded
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                this.clearOldEntries();
                try {
                    const cacheKey = this.getKey(key);
                    const version = options?.version || this.defaultVersion;
                    const entry: CacheEntry<T> = {
                        data,
                        timestamp: Date.now(),
                        version
                    };
                    localStorage.setItem(cacheKey, JSON.stringify(entry));
                    return true;
                } catch {
                    return false;
                }
            }
            return false;
        }
    }

    /**
     * Remove value from cache
     */
    remove(key: string): boolean {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const cacheKey = this.getKey(key);
            localStorage.removeItem(cacheKey);
            return true;
        } catch (error) {
            console.warn('Cache remove error:', error);
            return false;
        }
    }

    /**
     * Clear all cache entries with this prefix
     */
    clear(): void {
        if (!this.isAvailable()) {
            return;
        }

        try {
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.push(key);
                }
            }
            keys.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.warn('Cache clear error:', error);
        }
    }

    /**
     * Clear old entries to free up space
     */
    private clearOldEntries(): void {
        if (!this.isAvailable()) {
            return;
        }

        try {
            const entries: Array<{ key: string; timestamp: number }> = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    try {
                        const cached = localStorage.getItem(key);
                        if (cached) {
                            const entry = JSON.parse(cached) as CacheEntry<unknown>;
                            entries.push({ key, timestamp: entry.timestamp });
                        }
                    } catch {
                        // Invalid entry, remove it
                        localStorage.removeItem(key);
                    }
                }
            }

            // Sort by timestamp (oldest first)
            entries.sort((a, b) => a.timestamp - b.timestamp);

            // Remove oldest entries if we exceed max size
            const maxSize = MAX_CACHE_SIZE;
            if (entries.length > maxSize) {
                const toRemove = entries.slice(0, entries.length - maxSize);
                toRemove.forEach(({ key }) => localStorage.removeItem(key));
            }
        } catch (error) {
            console.warn('Clear old entries error:', error);
        }
    }

    /**
     * Get all cache keys with this prefix
     */
    keys(): string[] {
        if (!this.isAvailable()) {
            return [];
        }

        const keys: string[] = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    // Remove prefix to return just the key
                    const cleanKey = key.replace(`${this.prefix}-`, '');
                    keys.push(cleanKey);
                }
            }
        } catch (error) {
            console.warn('Cache keys error:', error);
        }
        return keys;
    }
}

// Export singleton instance
export const documentCache = new LocalStorageCache('doc-autocomplete', 5 * 60 * 1000);

// Export class for custom instances
export { LocalStorageCache };

