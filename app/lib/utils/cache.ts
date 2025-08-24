/**
 * Caching Utilities
 * Provides caching mechanisms for data and API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

/**
 * In-memory cache implementation
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
  }

  /**
   * Set a cache entry
   */
  set(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Get a cache entry
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired: expiredCount,
      hitRatio: 0 // Would need hit/miss tracking for this
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }
}

/**
 * Browser localStorage cache for persistent caching
 */
export class LocalStorageCache<T = any> {
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string = 'nc-health-cache', ttl: number = 24 * 60 * 60 * 1000) {
    this.prefix = prefix;
    this.defaultTTL = ttl; // 24 hours default
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Set a cache entry in localStorage
   */
  set(key: string, data: T, ttl?: number): void {
    if (typeof window === 'undefined') return; // Skip in SSR

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  /**
   * Get a cache entry from localStorage
   */
  get(key: string): T | null {
    if (typeof window === 'undefined') return null; // Skip in SSR

    try {
      const item = localStorage.getItem(this.getKey(key));
      
      if (!item) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (this.isExpired(entry)) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('Failed to delete localStorage cache:', error);
    }
  }

  /**
   * Clear all cache entries for this prefix
   */
  clear(): void {
    if (typeof window === 'undefined') return;

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
}

/**
 * Async cache wrapper for functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cache: MemoryCache,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    // Try to get from cache first
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cache.set(key, result, ttl);
    
    return result;
  }) as T;
}

/**
 * Create cache instances for different data types
 */
export const healthcareDataCache = new MemoryCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 50
});

export const hospitalDataCache = new MemoryCache({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 20
});

export const geoDataCache = new MemoryCache({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 10
});

export const persistentCache = new LocalStorageCache('nc-health-app');

/**
 * Cache cleanup interval (runs every 5 minutes)
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    healthcareDataCache.cleanup();
    hospitalDataCache.cleanup();
    geoDataCache.cleanup();
  }, 5 * 60 * 1000);
}