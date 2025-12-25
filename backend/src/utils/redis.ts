/**
 * Redis connection configuration
 */

import Redis, { RedisOptions } from 'ioredis';

/**
 * Create Redis connection based on environment variables
 */
export function createRedisConnection(): Redis {
  // Use REDIS_URL if provided, otherwise use individual config
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }

  // Individual configuration
  const config: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };

  if (process.env.REDIS_PASSWORD) {
    config.password = process.env.REDIS_PASSWORD;
  }

  return new Redis(config);
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(redis: Redis): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

/**
 * Global Redis connection instance
 */
export const redis = createRedisConnection();

// Test connection on startup
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (error) => {
  console.error('❌ Redis error:', error);
});

