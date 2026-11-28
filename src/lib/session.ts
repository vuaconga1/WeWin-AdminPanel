/**
 * Verify wewin_session (HMAC-SHA256).
 * Issued by AdminPanel login; sibling apps verify with the same SESSION_SECRET.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";

export const COOKIE_NAME = "wewin_session";

export type SessionUser = {
  id: string;
  email: string | null;
  username: string;
  fullName: string | null;
  role: string;
};

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to a string of at least 16 characters in production",
    );
  }
  return "wewin-dev-session-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function decodeSession(token: string): SessionUser | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionUser & { exp?: number };
    if (data.exp && Date.now() > data.exp) return null;
    if (!data.id || !data.username || !data.role) return null;
    return {
      id: data.id,
      email: data.email ?? null,
      username: data.username,
      fullName: data.fullName ?? null,
      role: data.role,
    };
  } catch {
    return null;
  }
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "ADMIN";
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
});

export async function requireAdminSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new SessionError("LOGIN_REQUIRED", "Cần đăng nhập");
  }
  if (!isAdminRole(user.role)) {
    throw new SessionError("ADMIN_REQUIRED", "Cần quyền admin");
  }
  return user;
}

export class SessionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** Clear host-only + shared Domain variants (logout). */
export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  const domain = process.env.SESSION_COOKIE_DOMAIN?.trim() || undefined;
  const base = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" || Boolean(domain),
    path: "/",
    maxAge: 0,
  };
  jar.set(COOKIE_NAME, "", base);
  if (domain) {
    jar.set(COOKIE_NAME, "", { ...base, domain });
  }
}
