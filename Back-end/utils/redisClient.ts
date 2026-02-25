import Redis from "ioredis";
import logger from "./logger";

// Track whether Redis is currently usable
let isConnected = false;
let errorLogged = false;

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    connectTimeout: 1000,          // fail fast — don't wait >1s to connect
    commandTimeout: 500,           // fail fast on commands too
    maxRetriesPerRequest: 0,       // don't retry individual commands
    enableOfflineQueue: false,     // reject commands immediately when offline
    lazyConnect: true,             // don't connect on import
    retryStrategy(times) {
        if (times >= 2) {
            // Give up quickly — app still works without Redis
            return null;
        }
        return 1000; // try once more after 1s
    },
});

redis.on("connect", () => {
    isConnected = true;
    errorLogged = false;
    logger.info("✅ Redis connected successfully");
});

redis.on("error", (err) => {
    isConnected = false;
    if (!errorLogged) {
        logger.warn(`⚠️ Redis unavailable: ${err.message} — running without cache`);
        errorLogged = true;
    }
});

redis.on("close", () => {
    isConnected = false;
});

// Non-blocking connect attempt
redis.connect().catch(() => { /* handled in error event */ });

// Export both the client and the connection state checker
export { isConnected };
export default redis;
