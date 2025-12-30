import { Request, Response, NextFunction } from "express";
import { redis } from "../cache/redis.client";

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const key = `rate:${userId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, 60); // Set expiration on first request
    }

    const limit = 30; // 30 requests per minute
    if (count > limit) {
      return res.status(429).json({ 
        error: "Too many requests",
        retryAfter: 60
      });
    }

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - count).toString());

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    // On Redis error, allow the request to proceed
    next();
  }
}

export async function acquireLock(id: string): Promise<boolean> {
  try {
    // Use set with NX (only if not exists) and EX (expiration in seconds)
    // ioredis supports: set(key, value, 'EX', seconds, 'NX')
    const result = await redis.set(`lock:${id}`, "1", "EX", 30, "NX");
    return result === "OK" || result === 1;
  } catch (error) {
    console.error("Lock acquisition error:", error);
    return false;
  }
}

/**
 * Rate limiter for sessionId-based requests (no auth required)
 * Uses sessionId from request body or generates a temporary one
 */
export async function rateLimiterBySession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get sessionId from body (if parsed) or use IP as fallback
    // Note: express.json() runs before routes, so req.body should be available
    // But we handle the case where it might not be parsed yet
    let sessionId: string;
    if (req.body && typeof req.body === "object" && req.body.sessionId) {
      sessionId = req.body.sessionId;
    } else {
      // Fallback to IP address for rate limiting
      sessionId = req.ip || req.socket.remoteAddress || "anonymous";
    }

    const key = `rate:session:${sessionId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, 60); // Set expiration on first request
    }

    const limit = 30; // 30 requests per minute
    if (count > limit) {
      return res.status(429).json({ 
        error: "Too many requests. Please wait a moment before sending another message.",
        retryAfter: 60
      });
    }

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - count).toString());

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    // On Redis error, allow the request to proceed (graceful degradation)
    // This ensures the app works even if Redis is down
    next();
  }
}
