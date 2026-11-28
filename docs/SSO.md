# WeWIN SSO

## Admin Panel login

Admin Panel uses a local login form against its own Postgres `AdminUser` table.
Successful login sets `wewin_session` (HMAC-SHA256, same shape as IELTS).

Cookie flags: `HttpOnly`, `SameSite=Lax`, `Secure` (prod / when Domain set), `Path=/`, `Max-Age=14d`.

| Variable | Notes |
|----------|--------|
| `SESSION_SECRET` | ≥16 chars; match IELTS / Chinese if they verify the same cookie |
| `SESSION_COOKIE_DOMAIN` | Production: `.wewin.edu.vn`. Omit on localhost |
| `WEWIN_HUB_API_KEY` | ≥16 chars; **must match** every product hub + embed SSO consume |

## Embed SSO (iframe «Trang chính» → product admin)

Product apps do **not** share one cookie format. Admin Panel mints a short-lived
token and each product sets its **native** admin session.

```
Admin /p/{product} → tab Trang chính
  → iframe src=/api/sso/embed?product=ielts&embed=1
  → require ADMIN wewin_session
  → mint token (HMAC WEWIN_HUB_API_KEY, TTL ~90s)
  → 302 {productOrigin}/api/hub/embed-sso-consume?token=…&product=…&embed=1
  → product sets its own admin cookie
  → 302 product admin path
```

| Product | Consume | Native session | Landing |
|---------|---------|----------------|---------|
| IELTS | `/api/hub/embed-sso-consume` | `wewin_session` HMAC ADMIN | `/admin` |
| Cambridge | `/api/hub/embed-sso-consume` | `wewin_admin` (Partitioned when `embed=1`) | `/admin` |
| Exam | `/api/hub/embed-sso-consume` | DB hex `wewin_session` | `/?screen=staff` |
| TOEIC | `/api/hub/embed-sso-consume` | NextAuth `wewin-toeic.session-token` | `/manage/toeic` |
| DailyTalk | `/api/hub/embed-sso-consume` | `ww_session` (DB user ADMIN) | `/admin` |
| Chinese | `/api/hub/embed-sso-consume` | `wewin_zh_session` HMAC ADMIN | `/admin` |
| VSTEP | *(pending — no local consume yet)* | — | `/manage/vstep` |

«Mở tab mới» uses the same bridge with `embed=0` (top-level; Cambridge uses Lax cookie).

### Product-side env

| App | Extra vars |
|-----|------------|
| Exam | `HUB_SSO_ADMIN_USERNAME` — admin username in practice DB if token username differs |
| TOEIC | `HUB_SSO_ADMIN_EMAIL` — fallback ADMIN email in TOEIC DB; needs `AUTH_SECRET` |
| DailyTalk | `HUB_SSO_ADMIN_EMAIL` — fallback ADMIN email |
| All | `WEWIN_HUB_API_KEY` identical to Admin Panel; CSP `frame-ancestors` includes `admin.wewin.edu.vn` |

### Cambridge cross-site note

Cambridge is on `*.vercel.app` (cross-site vs Admin Panel). Embed SSO sets
`SameSite=None; Secure; Partitioned` when `embed=1`. Prefer adding
`cambridge.wewin.edu.vn` later so same-site Lax works without CHIPS.

Attempt deep-link SSO remains `/api/cambridge-sso?attempt=…` → Cambridge
`/api/hub/sso-consume` (Lax cookie, top-level).

## Production checklist

1. Admin Panel: `SESSION_COOKIE_DOMAIN=.wewin.edu.vn`, `WEWIN_HUB_API_KEY`, product `*_PUBLIC_SITE_URL`
2. Each product: same `WEWIN_HUB_API_KEY`, deploy consume route + `frame-ancestors`
3. Exam/TOEIC/DailyTalk: map Admin Panel user → local ADMIN (`HUB_SSO_ADMIN_*`)
4. Redeploy Admin Panel + every product after shipping consume endpoints

## Logout

Clear **host-only** and **Domain** variants of `wewin_session` on Admin Panel logout
(`clearSessionCookies`). Product apps clear their own cookies on their logout.
