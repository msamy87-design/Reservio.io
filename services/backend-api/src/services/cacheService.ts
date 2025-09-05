import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { performanceMonitoring } from './performanceMonitoringService';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  enableAutoPipelining: boolean;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Compress large values
  tags?: string[]; // Tags for cache invalidation
}

export class CacheService {
  private redis: Redis;
  private isConnected: boolean = false;
  private compressionThreshold: number = 1024; // Compress values larger than 1KB

  constructor(config: CacheConfig) {
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      retryDelayOnFailover: config.retryDelayOnFailover,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      enableAutoPipelining: config.enableAutoPipelining,
      lazyConnect: true,
      reconnectOnError: (error) => {
        logger.error('Redis connection error:', error);
        return true; // Always try to reconnect
      }
    });

    this.setupEventHandlers();
    this.connect();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      logger.info('Redis connected');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      logger.error('Redis error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  private async connect(): Promise<void> {
    try {
      await this.redis.connect();
      await this.redis.ping();
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Set cache value with optional compression and TTL
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected) {
      logger.debug('Cache set skipped - Redis not connected');
      return false;
    }

    const startTime = Date.now();

    try {
      let serializedValue: string;

      // Serialize value
      if (typeof value === 'string') {
        serializedValue = value;
      } else {
        serializedValue = JSON.stringify(value);
      }

      // Compress if needed
      if (options.compress && serializedValue.length > this.compressionThreshold) {
        serializedValue = await this.compress(serializedValue);
        key = `compressed:${key}`;
      }

      // Set with TTL if provided
      if (options.ttl) {
        await this.redis.setex(key, options.ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addTagsToKey(key, options.tags);
      }

      const duration = Date.now() - startTime;
      performanceMonitoring.trackCacheOperation('set', key, duration);
      
      logger.debug(`Cache SET: ${key} (${serializedValue.length} bytes)`);
      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      performanceMonitoring.trackCacheOperation('set', key, duration);
      
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache value with automatic decompression
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      logger.debug('Cache get skipped - Redis not connected');
      return null;
    }

    const startTime = Date.now();

    try {
      let value = await this.redis.get(key);
      
      if (value === null) {
        // Try compressed version
        value = await this.redis.get(`compressed:${key}`);
        if (value !== null) {
          value = await this.decompress(value);
          key = `compressed:${key}`;
        }
      }

      const duration = Date.now() - startTime;

      if (value === null) {
        performanceMonitoring.trackCacheOperation('miss', key, duration);
        logger.debug(`Cache MISS: ${key}`);
        return null;
      }

      performanceMonitoring.trackCacheOperation('hit', key, duration);
      logger.debug(`Cache HIT: ${key}`);

      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      performanceMonitoring.trackCacheOperation('miss', key, duration);
      
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache key
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const startTime = Date.now();

    try {
      const deleted = await this.redis.del(key);
      
      // Also try to delete compressed version
      await this.redis.del(`compressed:${key}`);
      
      // Remove from tag sets
      await this.removeKeyFromAllTags(key);

      const duration = Date.now() - startTime;
      performanceMonitoring.trackCacheOperation('delete', key, duration);
      
      logger.debug(`Cache DELETE: ${key}`);
      return deleted > 0;

    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const exists = await this.redis.exists(key);
      const compressedExists = await this.redis.exists(`compressed:${key}`);
      return exists > 0 || compressedExists > 0;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set expiration time for key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.expire(key, seconds);
      await this.redis.expire(`compressed:${key}`, seconds);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isConnected || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.redis.mget(...keys);
      
      return values.map((value, index) => {
        if (value === null) {
          performanceMonitoring.trackCacheOperation('miss', keys[index]);
          return null;
        }

        performanceMonitoring.trackCacheOperation('hit', keys[index]);
        
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      });

    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const pipeline = this.redis.pipeline();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        if (ttl) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      }

      await pipeline.exec();
      
      Object.keys(keyValuePairs).forEach(key => {
        performanceMonitoring.trackCacheOperation('set', key);
      });

      return true;

    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.isConnected || tags.length === 0) {
      return 0;
    }

    try {
      let totalDeleted = 0;

      for (const tag of tags) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        
        if (keys.length > 0) {
          const deleted = await this.redis.del(...keys);
          totalDeleted += deleted;
          
          // Remove the tag set
          await this.redis.del(`tag:${tag}`);
        }
      }

      logger.info(`Invalidated ${totalDeleted} cache entries for tags: ${tags.join(', ')}`);
      return totalDeleted;

    } catch (error) {
      logger.error('Cache invalidate by tags error:', error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.redis.flushdb();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    const stats = {
      connected: this.isConnected,
      keyCount: 0,
      memoryUsage: 'unknown',
      hitRate: undefined
    };

    if (!this.isConnected) {
      return stats;
    }

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:(.*)/);
      if (memoryMatch) {
        stats.memoryUsage = memoryMatch[1].trim();
      }

      // Parse key count
      const keyMatch = keyspace.match(/keys=(\d+)/);
      if (keyMatch) {
        stats.keyCount = parseInt(keyMatch[1]);
      }

      return stats;

    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return stats;
    }
  }

  /**
   * Create a cache key with namespace
   */
  createKey(namespace: string, identifier: string): string {
    return `reservio:${namespace}:${identifier}`;
  }

  /**
   * Wrap a function with caching
   */
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, options);
    return result;
  }

  /**
   * Add key to tag sets for invalidation
   */
  private async addTagsToKey(key: string, tags: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, key);
    }
    
    await pipeline.exec();
  }

  /**
   * Remove key from all tag sets
   */
  private async removeKeyFromAllTags(key: string): Promise<void> {
    try {
      const tagKeys = await this.redis.keys('tag:*');
      
      if (tagKeys.length > 0) {
        const pipeline = this.redis.pipeline();
        
        for (const tagKey of tagKeys) {
          pipeline.srem(tagKey, key);
        }
        
        await pipeline.exec();
      }
    } catch (error) {
      logger.error('Error removing key from tags:', error);
    }
  }

  /**
   * Simple compression using built-in zlib
   */
  private async compress(data: string): Promise<string> {
    try {
      const { promisify } = require('util');
      const { gzip } = require('zlib');
      const gzipAsync = promisify(gzip);
      
      const compressed = await gzipAsync(Buffer.from(data));
      return compressed.toString('base64');
    } catch (error) {
      logger.error('Compression error:', error);
      return data; // Return original on error
    }
  }

  /**
   * Simple decompression using built-in zlib
   */
  private async decompress(compressedData: string): Promise<string> {
    try {
      const { promisify } = require('util');
      const { gunzip } = require('zlib');
      const gunzipAsync = promisify(gunzip);
      
      const buffer = Buffer.from(compressedData, 'base64');
      const decompressed = await gunzipAsync(buffer);
      return decompressed.toString();
    } catch (error) {
      logger.error('Decompression error:', error);
      return compressedData; // Return original on error
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

// Default cache configuration
const defaultConfig: CacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableAutoPipelining: true
};

// Export singleton instance
export const cacheService = new CacheService(defaultConfig);

// Export cache decorators and utilities
export const CacheKeys = {
  BUSINESS: 'business',
  SERVICE: 'service',
  STAFF: 'staff',
  BOOKING: 'booking',
  CUSTOMER: 'customer',
  SEARCH: 'search',
  AUTH: 'auth'
} as const;

export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
} as const;