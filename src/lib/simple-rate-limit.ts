type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function requestClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** In-process rate limit (fine for single-instance / local; not shared across serverless isolates). */
export async function consumeRateLimit(opts: {
  scope: string;
  identity: string;
  limit: number;
  windowSeconds: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = `${opts.scope}:${opts.identity}`;
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: opts.windowSeconds };
  }
  if (current.count >= opts.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: opts.windowSeconds };
}
