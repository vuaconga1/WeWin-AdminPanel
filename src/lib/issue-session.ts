import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { COOKIE_NAME, type SessionUser } from "@/lib/session";

const MAX_AGE_SEC = 60 * 60 * 24 * 14;

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET missing");
  }
  return "wewin-dev-session-secret-change-me";
}

function encodeSession(user: SessionUser): string {
  const body = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Date.now() + MAX_AGE_SEC * 1000,
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", sessionSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

function sessionCookieBase(domain: string | undefined) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" || Boolean(domain),
    path: "/" as const,
    ...(domain ? { domain } : {}),
  };
}

function expireSessionCookie(
  jar: Awaited<ReturnType<typeof cookies>>,
  domain?: string,
): void {
  jar.set(COOKIE_NAME, "", {
    ...sessionCookieBase(domain),
    maxAge: 0,
  });
}

/**
 * Issue wewin_session so product sites that share SESSION_SECRET
 * (+ SESSION_COOKIE_DOMAIN in prod) accept this cookie without re-login.
 */
export async function issueLocalSession(user: SessionUser): Promise<void> {
  const jar = await cookies();
  const domain = process.env.SESSION_COOKIE_DOMAIN?.trim() || undefined;
  // Drop legacy host-only cookie when issuing a shared Domain cookie.
  if (domain) {
    expireSessionCookie(jar);
  }
  jar.set(COOKIE_NAME, encodeSession(user), {
    ...sessionCookieBase(domain),
    maxAge: MAX_AGE_SEC,
  });
}
