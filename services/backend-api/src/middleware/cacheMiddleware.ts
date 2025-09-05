import { Request, Response, NextFunction } from 'express';
import { cacheService, CacheKeys, CacheTTL } from '../services/cacheService';
import { logger } from '../utils/logger';

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyPrefix?: string;
  skipCacheIf?: (req: Request) => boolean;
  varyBy?: string[]; // Query params or headers to include in cache key
  tags?: string[];
}

/**
 * Create cache middleware for GET requests
 */
export function createCacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = CacheTTL.MEDIUM,
    keyPrefix = 'api',
    skipCacheIf,
    varyBy = [],
    tags = []
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if condition is met
    if (skipCacheIf && skipCacheIf(req)) {
      return next();
    }

    // Create cache key
    const cacheKey = createCacheKey(req, keyPrefix, varyBy);
    
    try {
      // Try to get cached response
      const cached = await cacheService.get<{
        body: any;
        headers: Record<string, string>;
        statusCode: number;
      }>(cacheKey);

      if (cached) {
        // Set cached headers
        Object.entries(cached.headers).forEach(([key, value]) => {
          res.set(key, value);
        });

        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        logger.debug(`Cache HIT for ${req.originalUrl}`);
        return res.status(cached.statusCode).json(cached.body);
      }

      // Cache miss - continue to route handler
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function(body: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cacheData = {
            body,
            headers: extractCacheableHeaders(res),
            statusCode: res.statusCode
          };

          // Cache asynchronously (don't wait)
          cacheService.set(cacheKey, cacheData, { 
            ttl, 
            tags: [...tags, keyPrefix] 
          }).catch(error => {
            logger.error('Failed to cache response:', error);
          });
        }

        return originalJson(body);
      };

      next();

    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue without cache on error
    }
  };
}

/**
 * Cache invalidation middleware
 */
export function createCacheInvalidationMiddleware(tags: string[] = []) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    res.json = function(body: any) {
      // Invalidate cache after successful write operations
      if (res.statusCode >= 200 && res.statusCode < 300 && 
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        
        // Invalidate relevant cache tags
        const invalidationTags = [
          ...tags,
          getCacheTagsFromRoute(req.route?.path || req.path),
          'api' // Invalidate general API cache
        ].filter(Boolean);

        if (invalidationTags.length > 0) {
          cacheService.invalidateByTags(invalidationTags).catch(error => {
            logger.error('Failed to invalidate cache:', error);
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Business-specific cache middleware
 */
export const businessCacheMiddleware = createCacheMiddleware({
  ttl: CacheTTL.LONG,
  keyPrefix: CacheKeys.BUSINESS,
  varyBy: ['lat', 'lon', 'query', 'limit', 'page'],
  tags: [CacheKeys.BUSINESS, CacheKeys.SERVICE, CacheKeys.STAFF],
  skipCacheIf: (req) => {
    // Skip cache for authenticated business owners viewing their own data
    const user = (req as any).user;
    return user && user.role !== 'customer';
  }
});

/**
 * Search cache middleware with shorter TTL
 */
export const searchCacheMiddleware = createCacheMiddleware({
  ttl: CacheTTL.SHORT,
  keyPrefix: CacheKeys.SEARCH,
  varyBy: ['query', 'lat', 'lon', 'maxDistance', 'minPrice', 'maxPrice', 'minRating', 'priceTiers', 'amenities'],
  tags: [CacheKeys.SEARCH, CacheKeys.BUSINESS],
  skipCacheIf: (req) => {
    // Don't cache personalized search results
    const user = (req as any).user;
    return user && user.id;
  }
});

/**
 * Service cache middleware
 */
export const serviceCacheMiddleware = createCacheMiddleware({
  ttl: CacheTTL.LONG,
  keyPrefix: CacheKeys.SERVICE,
  tags: [CacheKeys.SERVICE, CacheKeys.BUSINESS]
});

/**
 * Staff cache middleware
 */
export const staffCacheMiddleware = createCacheMiddleware({
  ttl: CacheTTL.MEDIUM,
  keyPrefix: CacheKeys.STAFF,
  tags: [CacheKeys.STAFF, CacheKeys.BUSINESS]
});

/**
 * Cache invalidation for business operations
 */
export const businessInvalidationMiddleware = createCacheInvalidationMiddleware([
  CacheKeys.BUSINESS,
  CacheKeys.SERVICE,
  CacheKeys.STAFF,
  CacheKeys.SEARCH
]);

/**
 * Cache invalidation for booking operations
 */
export const bookingInvalidationMiddleware = createCacheInvalidationMiddleware([
  CacheKeys.BOOKING,
  CacheKeys.BUSINESS, // Availability might change
  CacheKeys.SEARCH    // Search results might include availability
]);

/**
 * Utility functions
 */
function createCacheKey(req: Request, prefix: string, varyBy: string[]): string {
  const parts = [
    'reservio',
    prefix,
    req.path.replace(/\//g, ':')
  ];

  // Add query parameters that affect the response
  if (varyBy.length > 0) {
    const varyValues: string[] = [];
    
    varyBy.forEach(param => {
      const value = req.query[param];
      if (value) {
        varyValues.push(`${param}=${String(value)}`);
      }
    });

    if (varyValues.length > 0) {
      parts.push(varyValues.sort().join('&'));
    }
  }

  // Include user ID for personalized responses (but not for public data)
  const user = (req as any).user;
  if (user && !isPublicRoute(req.path)) {
    parts.push(`user=${user.id}`);
  }

  return parts.join(':');
}

function extractCacheableHeaders(res: Response): Record<string, string> {
  const cacheableHeaders: Record<string, string> = {};
  
  // Only cache specific headers
  const headersToCache = [
    'content-type',
    'content-language',
    'content-encoding',
    'etag',
    'last-modified'
  ];

  headersToCache.forEach(header => {
    const value = res.get(header);
    if (value) {
      cacheableHeaders[header] = value;
    }
  });

  return cacheableHeaders;
}

function getCacheTagsFromRoute(routePath: string): string {
  // Map route patterns to cache tags
  const routeTagMap: Record<string, string> = {
    '/businesses': CacheKeys.BUSINESS,
    '/services': CacheKeys.SERVICE,
    '/staff': CacheKeys.STAFF,
    '/bookings': CacheKeys.BOOKING,
    '/customers': CacheKeys.CUSTOMER,
    '/search': CacheKeys.SEARCH
  };

  for (const [pattern, tag] of Object.entries(routeTagMap)) {
    if (routePath.includes(pattern)) {
      return tag;
    }
  }

  return '';
}

function isPublicRoute(path: string): boolean {
  const publicRoutes = [
    '/businesses',
    '/services',
    '/search',
    '/health',
    '/docs'
  ];

  return publicRoutes.some(route => path.startsWith(route));
}

/**
 * Cache warming utility
 */
export class CacheWarmer {
  static async warmBusinessCache(): Promise<void> {
    try {
      logger.info('Starting cache warming for businesses...');
      
      // This would typically call your business service to preload popular businesses
      // Implementation depends on your business logic
      
      logger.info('Cache warming completed');
    } catch (error) {
      logger.error('Cache warming failed:', error);
    }
  }

  static async warmSearchCache(): Promise<void> {
    try {
      logger.info('Starting cache warming for search results...');
      
      // Preload common search queries
      // Implementation depends on your search analytics
      
      logger.info('Search cache warming completed');
    } catch (error) {
      logger.error('Search cache warming failed:', error);
    }
  }
}