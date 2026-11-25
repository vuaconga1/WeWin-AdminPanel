import { NextResponse } from "next/server";
import { getSessionUser, isAdminRole } from "@/lib/session";
import { isSsoConfigured } from "@/lib/sso";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  const ssoConfigured = isSsoConfigured();
  if (!user) {
    return NextResponse.json(
      { user: null, ssoConfigured },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return NextResponse.json(
    {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
      },
      isAdmin: isAdminRole(user.role),
      ssoConfigured,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
