import Redis from "ioredis";
import { env } from "../config/env";

export const redis = new Redis(env.redis, {
  retryStrategy: (times: number): number | null => {
    if (times > 3) {
      console.warn("⚠️  Redis connection failed after 3 retries. Rate limiting may not work.");
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000); // Retry with exponential backoff
  },
  // BullMQ requires maxRetriesPerRequest to be null for blocking operations
  maxRetriesPerRequest: null,
  enableOfflineQueue: false, // Don't queue commands when offline
  showFriendlyErrorStack: true
});

// Check Redis version on connection
async function checkRedisVersion(): Promise<void> {
  try {
    const info: string = await redis.info("server");
    const versionMatch = info.match(/redis_version:([\d.]+)/);
    if (versionMatch) {
      const version = versionMatch[1];
      const [major] = version.split(".").map(Number);
      
      if (major < 5) {
        console.error(
          "\n❌ Redis Version Error:\n" +
          `   Your Redis version is ${version}, but BullMQ requires Redis >= 5.0.0\n` +
          "   Solutions:\n" +
          "   1. Use Docker (Recommended): docker run -d -p 6379:6379 redis:7\n" +
          "   2. Upgrade your local Redis installation\n" +
          "   3. Use a cloud Redis service (Redis Cloud, Upstash, etc.)\n" +
          "   4. Update REDIS_URL in .env to point to Redis 5.0+\n"
        );
        throw new Error(`Redis version ${version} is too old. BullMQ requires Redis >= 5.0.0`);
      } else {
        console.log(`✅ Redis version ${version} is compatible`);
      }
    }
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes("too old")) {
      throw err; // Re-throw version errors
    }
    // Ignore other errors during version check
  }
}

// Handle connection events
redis.on("error", (err: Error) => {
  const redisError = err as any;
  if (redisError.code === "ECONNREFUSED") {
    console.error(
      "\n❌ Redis Connection Error:\n" +
      "   Redis is not running on " + env.redis + "\n" +
      "   Quick fix options:\n" +
      "   1. Docker: docker run -d -p 6379:6379 redis:7\n" +
      "   2. Update REDIS_URL in .env to point to your Redis instance\n" +
      "   3. Rate limiting will be disabled until Redis is available\n"
    );
  } else if (redisError.message?.includes("version")) {
    // Version error already handled
  } else {
    console.error("Redis error:", redisError.message || err.message);
  }
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
  // Check version after connection (fire and forget)
  checkRedisVersion().catch(() => {
    // Error already logged in checkRedisVersion
  });
});

redis.on("ready", () => {
  console.log("✅ Redis is ready");
});
