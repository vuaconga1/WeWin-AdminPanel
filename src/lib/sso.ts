/**
 * Cross-site SSO helpers — IELTS is temporary IdP (Phase 1).
 * Shared cookie: wewin_session + SESSION_SECRET (+ SESSION_COOKIE_DOMAIN in prod).
 */

export function adminOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_ADMIN_ORIGIN?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  return "https://admin.wewin.edu.vn";
}

/** Absolute allowlisted return URL for the AdminPanel path. */
export function absoluteReturnTo(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return new URL(clean, `${adminOrigin()}/`).toString();
}

/**
 * IELTS login URL with return_to back to this AdminPanel.
 * Returns null when IELTS_LOGIN_URL is unset (local-only login).
 */
export function buildIeltsSsoLoginUrl(returnPath = "/"): string | null {
  const loginBase = process.env.IELTS_LOGIN_URL?.trim();
  if (!loginBase) return null;
  try {
    const url = new URL(loginBase);
    url.searchParams.set("return_to", absoluteReturnTo(returnPath));
    return url.toString();
  } catch {
    return null;
  }
}

export function isSsoConfigured(): boolean {
  return Boolean(process.env.IELTS_LOGIN_URL?.trim());
}
