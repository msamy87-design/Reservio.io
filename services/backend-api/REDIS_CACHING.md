# Redis Caching Implementation

This document describes the Redis caching system implemented for the Reservio Backend API to improve performance and reduce database load.

## Overview

The caching layer provides:
- **Response Caching**: Cache API responses for faster subsequent requests
- **Data Compression**: Automatic compression for large cache values
- **Tag-based Invalidation**: Smart cache invalidation using tags
- **Graceful Degradation**: Application continues to work without Redis
- **Performance Monitoring**: Cache hit/miss tracking
- **TTL Management**: Configurable expiration times

## Architecture

### Cache Service (`CacheService`)
Core caching functionality with Redis backend:
- Connection management with automatic reconnection
- Compression for large values (>1KB)
- Tag-based cache invalidation
- Pipeline operations for batch operations
- Performance monitoring integration

### Cache Middleware (`cacheMiddleware`)
Express middleware for automatic response caching:
- GET request caching only
- Configurable cache keys with request variations
- Cache headers (`X-Cache: HIT/MISS`)
- Conditional caching based on user context
- Automatic cache invalidation on write operations

## Configuration

### Environment Variables

```bash
# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here
REDIS_DB=0

# Optional Redis settings
REDIS_URL=redis://localhost:6379  # Alternative to above
```

### Default Configuration
```typescript
const config = {
  host: 'localhost',
  port: 6379,
  password: undefined,
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableAutoPipelining: true
}
```

## Cache Keys Structure

All cache keys follow the pattern:
```
reservio:{namespace}:{identifier}:{variations}
```

Examples:
- `reservio:business:search:query=salon&lat=40.7128&lon=-74.0060`
- `reservio:service:business123:all`
- `reservio:search:hair&lat=40.7128&limit=20`

## TTL (Time To Live) Configuration

```typescript
export const CacheTTL = {
  SHORT: 300,      // 5 minutes - search results
  MEDIUM: 1800,    // 30 minutes - staff/availability
  LONG: 3600,      // 1 hour - business/service data
  VERY_LONG: 86400 // 24 hours - static content
}
```

## Cache Middleware Usage

### Business Data Caching
```typescript
import { businessCacheMiddleware } from '../middleware/cacheMiddleware';

router.get('/businesses/search', businessCacheMiddleware, searchBusinesses);
```

### Search Results Caching
```typescript
import { searchCacheMiddleware } from '../middleware/cacheMiddleware';

router.get('/search', searchCacheMiddleware, performSearch);
```

### Cache Invalidation
```typescript
import { businessInvalidationMiddleware } from '../middleware/cacheMiddleware';

router.post('/businesses', businessInvalidationMiddleware, createBusiness);
router.put('/businesses/:id', businessInvalidationMiddleware, updateBusiness);
```

## Programmatic Cache Usage

### Basic Operations
```typescript
import { cacheService } from '../services/cacheService';

// Set cache with TTL
await cacheService.set('user:123', userData, { ttl: 3600 });

// Get from cache
const user = await cacheService.get<UserData>('user:123');

// Delete from cache
await cacheService.delete('user:123');

// Check existence
const exists = await cacheService.exists('user:123');
```

### Advanced Features

#### Tag-based Invalidation
```typescript
// Set with tags
await cacheService.set('business:123:services', services, {
  ttl: 3600,
  tags: ['business', 'services', 'business:123']
});

// Invalidate by tags
await cacheService.invalidateByTags(['business:123']);
```

#### Function Wrapping
```typescript
const expensiveData = await cacheService.cached(
  'expensive:operation:123',
  async () => {
    // Expensive database operation
    return await performExpensiveOperation();
  },
  { ttl: 3600, tags: ['expensive'] }
);
```

#### Batch Operations
```typescript
// Set multiple keys
await cacheService.mset({
  'user:1': userData1,
  'user:2': userData2,
  'user:3': userData3
}, 3600);

// Get multiple keys
const users = await cacheService.mget(['user:1', 'user:2', 'user:3']);
```

## Cache Strategies

### Business Data
- **TTL**: 1 hour (LONG)
- **Tags**: `['business', 'services', 'staff']`
- **Invalidation**: On business profile updates
- **Variations**: Location, user type

### Search Results
- **TTL**: 5 minutes (SHORT)
- **Tags**: `['search', 'business']`
- **Invalidation**: On business updates
- **Variations**: Query params, location, user preferences

### Service Data
- **TTL**: 1 hour (LONG)
- **Tags**: `['service', 'business']`
- **Invalidation**: On service updates
- **Variations**: Business ID, availability date

### User Authentication
- **TTL**: 30 minutes (MEDIUM)
- **Tags**: `['auth', 'user']`
- **Invalidation**: On password change, logout
- **Variations**: User ID, session

## Performance Monitoring

### Cache Metrics Tracked
- Cache hit/miss ratios
- Response time improvements
- Memory usage
- Key count and distribution
- Compression efficiency

### Monitoring Integration
```typescript
// Automatic tracking in middleware
performanceMonitoring.trackCacheOperation('hit', cacheKey, duration);
performanceMonitoring.trackCacheOperation('miss', cacheKey, duration);
```

## Error Handling

### Graceful Degradation
The application continues to function normally when Redis is unavailable:

1. **Connection Failures**: Logged and retried automatically
2. **Cache Misses**: Fall back to database queries
3. **Write Failures**: Operations continue without caching
4. **Network Issues**: Automatic reconnection attempts

### Error Scenarios
```typescript
try {
  const result = await cacheService.get('key');
  if (result === null) {
    // Cache miss or error - fetch from database
    result = await fetchFromDatabase();
    // Try to cache for next time (fire and forget)
    cacheService.set('key', result).catch(() => {});
  }
  return result;
} catch (error) {
  // Always fall back to database
  return await fetchFromDatabase();
}
```

## Best Practices

### Cache Key Design
1. **Hierarchical**: Use consistent namespace structure
2. **Descriptive**: Include relevant variations in key
3. **Predictable**: Same input should generate same key
4. **Reasonable Length**: Avoid extremely long keys

### TTL Management
1. **Match Data Volatility**: Frequent changes = shorter TTL
2. **Consider Usage Patterns**: High-traffic = longer TTL
3. **Business Context**: Critical data = shorter TTL
4. **Resource Constraints**: Memory limits = shorter TTL

### Invalidation Strategy
1. **Tag Carefully**: Group related data with meaningful tags
2. **Cascade Properly**: Parent changes should invalidate children
3. **Time Appropriately**: Invalidate before data changes
4. **Batch Invalidation**: Use tags to invalidate multiple keys

### Memory Management
1. **Compression**: Enable for large objects (>1KB)
2. **Monitoring**: Track memory usage and key count
3. **Cleanup**: Use TTL to prevent indefinite growth
4. **Limits**: Set Redis memory limits and eviction policies

## Debugging

### Cache Headers
All cached responses include debug headers:
- `X-Cache: HIT|MISS` - Cache status
- `X-Cache-Key: key` - The cache key used

### Debug Logging
Enable debug logging for cache operations:
```bash
NODE_ENV=development npm start
```

### Cache Statistics
```typescript
const stats = await cacheService.getStats();
console.log('Cache Stats:', stats);
```

### Manual Cache Operations
```typescript
// Clear all cache
await cacheService.flush();

// Get specific key info
const exists = await cacheService.exists('problematic:key');
await cacheService.delete('problematic:key');
```

## Production Considerations

### Redis Configuration
```redis
# /etc/redis/redis.conf

# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence (optional for cache-only usage)
save ""
appendonly no

# Performance
tcp-keepalive 60
timeout 0

# Security
requirepass your_secure_password
bind 127.0.0.1
```

### Monitoring
1. **Memory Usage**: Monitor Redis memory consumption
2. **Hit Ratios**: Track cache effectiveness
3. **Response Times**: Measure performance improvements
4. **Error Rates**: Monitor connection failures

### Scaling
1. **Redis Cluster**: For high availability
2. **Read Replicas**: For read-heavy workloads
3. **Sharding**: Distribute keys across instances
4. **Connection Pooling**: Manage connection limits

## Cost Optimization

### Memory Efficiency
- Use compression for large values
- Set appropriate TTLs
- Monitor and clean unused keys
- Choose efficient data structures

### Network Efficiency
- Use pipelining for batch operations
- Minimize round trips
- Compress network traffic
- Use connection pooling

### Operational Efficiency
- Automate cache warming
- Monitor and alert on issues
- Use appropriate instance sizes
- Regular maintenance and updates

## Testing

### Unit Tests
```typescript
describe('Cache Service', () => {
  it('should cache and retrieve values', async () => {
    await cacheService.set('test:key', { data: 'value' });
    const result = await cacheService.get('test:key');
    expect(result.data).toBe('value');
  });
});
```

### Integration Tests
```typescript
describe('Cache Middleware', () => {
  it('should cache GET responses', async () => {
    const response1 = await request(app).get('/api/businesses');
    expect(response1.headers['x-cache']).toBe('MISS');
    
    const response2 = await request(app).get('/api/businesses');
    expect(response2.headers['x-cache']).toBe('HIT');
  });
});
```

## Troubleshooting

### Common Issues

1. **Cache Not Working**
   - Check Redis connection
   - Verify environment variables
   - Check cache middleware registration

2. **High Memory Usage**
   - Review TTL settings
   - Check for cache key leaks
   - Monitor compression usage

3. **Cache Invalidation Issues**
   - Verify tag assignments
   - Check invalidation middleware
   - Review cache key patterns

4. **Performance Problems**
   - Monitor Redis metrics
   - Check network latency
   - Review cache hit ratios