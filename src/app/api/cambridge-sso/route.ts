import { NextResponse } from "next/server";
import { z } from "zod";
import {
  cambridgePublicOrigin,
  hubApiKeyOrNull,
  mintCambridgeSsoToken,
} from "@/lib/cambridge-sso";
import {
  getSessionUser,
  isAdminRole,
  SessionError,
} from "@/lib/session";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

const querySchema = z.object({
  attempt: z
    .string()
    .trim()
    .min(8)
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

/**
 * Admin Panel SSO bridge → Cambridge staff admin.
 * Requires WeWIN Admin session; mints short-lived token; redirects to Cambridge.
 */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      const here = new URL(request.url);
      const login = new URL("/login", request.url);
      login.searchParams.set("next", `${here.pathname}${here.search}`);
      return NextResponse.redirect(login.toString(), {
        status: 302,
        headers: NO_STORE,
      });
    }
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { code: "ADMIN_REQUIRED" },
        { status: 403, headers: NO_STORE },
      );
    }

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      attempt: url.searchParams.get("attempt") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json(
        { code: "INVALID_INPUT" },
        { status: 400, headers: NO_STORE },
      );
    }

    const key = hubApiKeyOrNull();
    if (!key) {
      return NextResponse.json(
        { code: "CAMBRIDGE_HUB_NOT_CONFIGURED" },
        { status: 503, headers: NO_STORE },
      );
    }

    const token = mintCambridgeSsoToken(parsed.data.attempt, key);
    const target = new URL("/api/hub/sso-consume", cambridgePublicOrigin());
    target.searchParams.set("token", token);
    target.searchParams.set("attempt", parsed.data.attempt);

    return NextResponse.redirect(target.toString(), {
      status: 302,
      headers: NO_STORE,
    });
  } catch (error) {
    if (error instanceof SessionError) {
      return NextResponse.json(
        { code: error.code },
        {
          status: error.code === "LOGIN_REQUIRED" ? 401 : 403,
          headers: NO_STORE,
        },
      );
    }
    console.error("[api/cambridge-sso]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
