import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextRequest } from "next/server";

// In-memory limiter — cukup untuk deployment satu instance VPS (lihat plan §keamanan).
// Kalau nanti perlu banyak instance, ganti ke RateLimiterRedis dengan signature yang sama.
const publicReadRateLimit = new RateLimiterMemory({ points: 60, duration: 60 });
const externalLookupRateLimit = new RateLimiterMemory({ points: 20, duration: 60 });
const authRateLimit = new RateLimiterMemory({ points: 10, duration: 15 * 60 });
const adminMutationRateLimit = new RateLimiterMemory({ points: 60, duration: 5 * 60 });

export const limiters = {
  publicRead: publicReadRateLimit,
  externalLookup: externalLookupRateLimit,
  auth: authRateLimit,
  adminMutation: adminMutationRateLimit,
};

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export class RateLimitExceededError extends Error {
  constructor() {
    super("Terlalu banyak permintaan, silakan coba lagi beberapa saat lagi.");
    this.name = "RateLimitExceededError";
  }
}

export async function consumeRateLimit(
  limiter: RateLimiterMemory,
  key: string,
): Promise<void> {
  try {
    await limiter.consume(key);
  } catch {
    throw new RateLimitExceededError();
  }
}
