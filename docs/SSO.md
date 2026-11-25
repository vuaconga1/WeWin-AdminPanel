# WeWIN SSO (shared session)

Phase 1: **IELTS is the IdP**. One `wewin_session` cookie unlocks AdminPanel and sibling apps that share the same secret.

## How it works

```
Browser opens admin.wewin.edu.vn
  → no ADMIN wewin_session
  → 302 IELTS /login?return_to=https://admin.wewin.edu.vn/...
  → login against IELTS user store
  → Set-Cookie wewin_session; Domain=.wewin.edu.vn
  → 302 back to return_to
  → AdminPanel + ielts.* + other *.wewin.edu.vn receive the same cookie
```

Cookie: `wewin_session` = `base64url(JSON).HMAC-SHA256`  
Flags: `HttpOnly`, `SameSite=Lax`, `Secure` (prod / when Domain set), `Path=/`, `Max-Age=14d`

## Env (must match across apps)

| Variable | AdminPanel | IELTS | Notes |
|----------|------------|-------|--------|
| `SESSION_SECRET` | same | same | ≥16 chars |
| `SESSION_COOKIE_DOMAIN` | `.wewin.edu.vn` | `.wewin.edu.vn` | omit on localhost |
| `IELTS_LOGIN_URL` | `https://ielts.wewin.edu.vn/login` | — | IdP entry |
| `NEXT_PUBLIC_ADMIN_ORIGIN` | `https://admin.wewin.edu.vn` | — | builds `return_to` |
| `WEWIN_HUB_ALLOWED_RETURN_ORIGINS` | — | include admin origin or `.wewin.edu.vn` | blocks open redirects |

## Localhost

- Ports do **not** isolate cookies: `localhost:3001` and `localhost:3000` share host-only `wewin_session`.
- Set the same `SESSION_SECRET` on both apps.
- `IELTS_LOGIN_URL=http://localhost:3001/login`
- Do **not** set `SESSION_COOKIE_DOMAIN` locally.

## Adding another product site

1. Copy `decodeSession` / cookie name / secret (or import a tiny shared package later).
2. On unauthenticated admin routes → redirect to `IELTS_LOGIN_URL?return_to=<this-app-url>`.
3. Ensure IELTS allowlists that origin.
4. Prefer verifying cookie only — do **not** sync password hashes between DBs.

## Cambridge note

Cambridge still uses a separate `wewin_admin` cookie + short-lived handoff (`/api/admin/hub/cambridge-sso`) for «Xem bài». Full Domain SSO for Cambridge is a follow-up (align cookie name + secret).

## Logout

Clear **host-only** and **Domain** variants of `wewin_session` on every app logout (already done in IELTS `destroySession` and AdminPanel `clearSessionCookies`).
