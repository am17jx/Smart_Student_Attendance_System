import redis from "./redisClient";
import logger from "./logger";

/**
 * Cache-Aside helper.
 * Tries Redis first; on miss or if Redis is unavailable, calls fetchFn() and returns result.
 * Falls back gracefully if Redis is down — app continues to work normally.
 *
 * @param key    - Redis key (e.g. "dashboard:admin:42")
 * @param ttl    - Time-to-live in seconds
 * @param fetchFn - Async function that fetches data from DB
 */
export async function withCache<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    // Try cache (skip if Redis is not connected)
    try {
        const cached = await redis.get(key);
        if (cached) {
            logger.info(`🎯 [Cache HIT] key="${key}"`);
            return JSON.parse(cached) as T;
        }
    } catch {
        // Redis unavailable — skip cache silently
        logger.debug(`⚠️ [Cache SKIP] Redis unavailable for key="${key}", fetching from DB`);
        return fetchFn();
    }

    // Cache miss — fetch from DB
    logger.info(`💾 [Cache MISS] key="${key}" — fetching from DB`);
    const data = await fetchFn();

    // Store in Redis (don't crash if it fails)
    try {
        await redis.set(
            key,
            JSON.stringify(data, (_k, v) =>
                typeof v === "bigint" ? v.toString() : v
            ),
            "EX",
            ttl
        );
    } catch {
        logger.debug(`⚠️ [Cache SET FAILED] Could not store key="${key}" in Redis`);
    }

    return data;
}

/**
 * Delete one or more cache keys (call after write operations).
 * Safe to call even if Redis is down.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
        await redis.del(...keys);
        logger.info(`🗑️ [Cache INVALIDATED] keys: ${keys.join(", ")}`);
    } catch {
        logger.debug(`⚠️ [Cache INVALIDATE FAILED] Redis unavailable`);
    }
}

/**
 * Delete all keys matching a pattern (e.g. "students:*").
 * Safe to call even if Redis is down.
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            logger.info(`🗑️ [Cache INVALIDATED] pattern="${pattern}" (${keys.length} keys)`);
        }
    } catch {
        logger.debug(`⚠️ [Cache INVALIDATE PATTERN FAILED] Redis unavailable for pattern="${pattern}"`);
    }
}
