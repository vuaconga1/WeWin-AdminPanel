import { NextResponse } from "next/server";
import {
  fetchDailyTalkAdmin,
  parseDailyTalkAdminQuery,
} from "@/lib/dailytalk-admin";
import {
  getSessionUser,
  isAdminRole,
  SessionError,
} from "@/lib/session";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, max-age=30" };

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { code: "LOGIN_REQUIRED" },
        { status: 401, headers: NO_STORE },
      );
    }
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { code: "ADMIN_REQUIRED" },
        { status: 403, headers: NO_STORE },
      );
    }

    const url = new URL(request.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const parsed = parseDailyTalkAdminQuery(raw);
    if (!parsed.ok) {
      return NextResponse.json(
        { code: "INVALID_INPUT" },
        { status: 400, headers: NO_STORE },
      );
    }

    const result = await fetchDailyTalkAdmin(parsed.data);
    return NextResponse.json(result, { headers: NO_STORE });
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
    console.error("[api/dailytalk-admin]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
