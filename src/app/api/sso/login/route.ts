import { NextResponse } from "next/server";
import { buildIeltsSsoLoginUrl, isSsoConfigured } from "@/lib/sso";

export const runtime = "nodejs";

/**
 * GET /api/sso/login?next=/ — 302 to IELTS IdP with return_to.
 * Used by the login page SSO button and soft redirects.
 */
export async function GET(request: Request) {
  if (!isSsoConfigured()) {
    return NextResponse.json(
      { code: "SSO_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const next = url.searchParams.get("next")?.trim() || "/";
  const safeNext = next.startsWith("/") ? next : "/";
  const ssoUrl = buildIeltsSsoLoginUrl(safeNext);
  if (!ssoUrl) {
    return NextResponse.json(
      { code: "SSO_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  return NextResponse.redirect(ssoUrl, 302);
}
