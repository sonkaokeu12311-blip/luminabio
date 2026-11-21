import Redis from "ioredis";

// Memory cache fallback for development when local Redis is not running
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying and use fallback
        return Math.min(times * 100, 1000);
      },
    });

    redisClient.on("error", (err) => {
      // Suppress noisy reconnection logs in dev
      if (process.env.NODE_ENV === "development") {
        console.warn("[Redis] Falling back to memory cache:", (err as Error).message);
      }
    });
  } catch (error) {
    console.warn("[Redis] Failed to initialize client, using memory cache fallback:", error);
  }
}

/**
 * Get cached string or JSON value from Redis / Memory
 */
export async function getCache<T = unknown>(key: string): Promise<T | null> {
  if (redisClient && redisClient.status === "ready") {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch {
      // Fall through to memory store
    }
  }

  // Memory fallback
  const item = memoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  try {
    return JSON.parse(item.value) as T;
  } catch {
    return item.value as unknown as T;
  }
}

/**
 * Set cached value in Redis / Memory with TTL in seconds
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds = 60
): Promise<void> {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);

  if (redisClient && redisClient.status === "ready") {
    try {
      await redisClient.set(key, serialized, "EX", ttlSeconds);
      return;
    } catch {
      // Fall through to memory store
    }
  }

  // Memory fallback
  memoryStore.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Invalidate a key in Redis / Memory
 */
export async function invalidateCache(key: string): Promise<void> {
  if (redisClient && redisClient.status === "ready") {
    try {
      await redisClient.del(key);
    } catch {
      // Ignore
    }
  }
  memoryStore.delete(key);
}
