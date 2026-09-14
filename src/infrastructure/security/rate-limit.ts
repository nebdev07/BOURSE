/**
 * Rate-limit simple en mémoire (par process).
 * Suffisant pour une instance Node ; en multi-instance préférer Redis plus tard.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/** Auth : 10 tentatives / 15 min / IP+route */
export function limitAuth(request: Request, route: string) {
  return rateLimit(`auth:${route}:${clientIp(request)}`, 10, 15 * 60 * 1000);
}

/** Import portefeuille : 20 / 15 min / IP */
export function limitPortfolioImport(request: Request) {
  return rateLimit(`portfolio-import:${clientIp(request)}`, 20, 15 * 60 * 1000);
}
