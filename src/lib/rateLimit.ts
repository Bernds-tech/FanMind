import type { NextRequest } from "next/server";
import { getTrustedClientIpValue } from "@/lib/clientIpPolicy.mjs";

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
 * Lightweight in-memory rate limit for the current single-process Production
 * topology. The canonical client identity is resolved centrally and cannot be
 * selected from the client-controlled first X-Forwarded-For hop.
 *
 * Buckets are still process-local and reset on deploy/restart. Replace this
 * counter with the atomic shared limiter tracked in #664 before PM2 cluster or
 * multi-instance scale-out.
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
  return getTrustedClientIpValue(request.headers, "anonymous");
}
