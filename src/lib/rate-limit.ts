interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000); // every minute

export interface RateLimitConfig {
  windowMs: number; // time window in milliseconds
  maxRequests: number; // max requests per window
}

export const RATE_LIMITS = {
  registration: { windowMs: 3600_000, maxRequests: 1 }, // 1 per hour
  upload: { windowMs: 86400_000, maxRequests: 10 }, // 10 per day
  api: { windowMs: 3600_000, maxRequests: 100 }, // 100 per hour
} as const;

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded", retry_after: retryAfter }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}
