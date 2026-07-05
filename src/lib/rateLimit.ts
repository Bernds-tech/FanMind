import type { NextRequest } from "next/server";

export type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Lightweight in-memory rate limit for MVP abuse/cost protection.
 * This is process-local and resets on deploy/restart; replace with Redis or
 * a Supabase-backed counter before scaling across multiple server instances.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.maxRequests - 1, resetAt };
  }

  bucket.count += 1;
  return {
    allowed: bucket.count <= options.maxRequests,
    remaining: Math.max(options.maxRequests - bucket.count, 0),
    resetAt: bucket.resetAt,
  };
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}
