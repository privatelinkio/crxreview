import { getLogger } from '../utils/logger';

/**
 * Cache service for KV namespace operations
 */
export class CacheService {
  private defaultTtl: number = 3600; // 1 hour

  constructor(
    private kv: KVNamespace,
    private logger = getLogger()
  ) {}

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.kv.get(`cache:${key}`);

      if (!data) {
        this.logger.debug('Cache miss', { key });
        return null;
      }

      const cached = JSON.parse(data) as { value: T; expiresAt: number };

      // Check if cache is expired
      if (cached.expiresAt < Date.now()) {
        this.logger.debug('Cache expired', { key });
        await this.delete(key);
        return null;
      }

      this.logger.debug('Cache hit', { key });
      return cached.value;
    } catch (error) {
      this.logger.error('Failed to get cache', error, { key });
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTtl
  ): Promise<void> {
    try {
      const cached = {
        value,
        expiresAt: Date.now() + ttl * 1000,
      };

      await this.kv.put(
        `cache:${key}`,
        JSON.stringify(cached),
        {
          expirationTtl: ttl,
        }
      );

      this.logger.debug('Cache set', { key, ttl });
    } catch (error) {
      this.logger.error('Failed to set cache', error, { key });
      throw error;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(`cache:${key}`);
      this.logger.debug('Cache deleted', { key });
    } catch (error) {
      this.logger.error('Failed to delete cache', error, { key });
      throw error;
    }
  }

  /**
   * Get or set cached value
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.defaultTtl
  ): Promise<T> {
    try {
      // Try to get from cache
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, compute value
      const value = await fn();

      // Store in cache
      await this.set(key, value, ttl);

      return value;
    } catch (error) {
      this.logger.error('Failed to get or set cache', error, { key });
      throw error;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const data = await this.kv.get(`cache:${key}`);
      return data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Invalidate cache keys
   */
  async invalidate(keys: string[]): Promise<number> {
    try {
      let count = 0;

      for (const key of keys) {
        await this.delete(key);
        count++;
      }

      this.logger.info('Cache invalidated', { count });
      return count;
    } catch (error) {
      this.logger.error('Failed to invalidate cache', error);
      throw error;
    }
  }

  /**
   * Clear all cache (admin operation)
   */
  async clear(): Promise<number> {
    try {
      let count = 0;
      const list = await this.kv.list({ prefix: 'cache:' });

      for (const item of list.keys) {
        await this.kv.delete(item.name);
        count++;
      }

      this.logger.info('Cache cleared', { count });
      return count;
    } catch (error) {
      this.logger.error('Failed to clear cache', error);
      throw error;
    }
  }

  /**
   * Set default TTL
   */
  setDefaultTtl(ttl: number): void {
    this.defaultTtl = ttl;
    this.logger.info('Default TTL updated', { ttl });
  }
}
