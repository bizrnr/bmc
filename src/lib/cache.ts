import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
}

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  try {
    const client = await getRedisClient();
    const cached = await client.get(key);
    
    if (cached) {
      return JSON.parse(cached) as T;
    }
    
    const fresh = await fetcher();
    await client.setEx(key, ttlSeconds, JSON.stringify(fresh));
    return fresh;
  } catch (error) {
    console.error('[cache] Error:', error);
    // Fallback to fetcher if Redis fails
    return fetcher();
  }
}

export async function invalidateCache(pattern: string) {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('[cache] Invalidate error:', error);
  }
}
