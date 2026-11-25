# WeWIN Admin Panel

Standalone hub at **`admin.wewin.edu.vn`** (own repo / deploy).

## What it is

- **Own backend**: Next.js API routes + Prisma + **PostgreSQL** (not shared with IELTS).
- **SSO (Phase 1)**: IELTS IdP issues shared `wewin_session`; same `SESSION_SECRET` (+ `SESSION_COOKIE_DOMAIN=.wewin.edu.vn` in prod). See [docs/SSO.md](docs/SSO.md).
- **Local admin fallback**: `AdminUser` in Postgres when `IELTS_LOGIN_URL` is unset.
- **Placement list**: BFF → IELTS/Cambridge hub APIs (Bearer), with local DB fallback.
- **Product deep-links**: optional links to each product’s native `/admin` UI.

## Local

```bash
cp .env.example .env.local
# Set DATABASE_URL to your Postgres, SESSION_SECRET (≥16), ADMIN_SEED_* 
cp .env.local .env   # Prisma CLI reads .env
npm install
npm run db:migrate
npm run db:seed
npm run dev          # http://localhost:3000
```

Default seed (override via env): `admin@wewin.local` / `Admin123!`

Local Postgres used in this workspace (optional): `postgresql://wewin@127.0.0.1:5433/wewin_admin`

## Production checklist

1. Provision a dedicated Postgres database (Neon/Supabase/etc.) — not the IELTS DB.
2. Set `DATABASE_URL`, `SESSION_SECRET`, seed or create an admin user.
3. `prisma migrate deploy` on release.
4. Deploy this app to `admin.wewin.edu.vn`.
