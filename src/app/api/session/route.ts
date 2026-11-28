import { NextResponse } from "next/server";
import { getSessionUser, isAdminRole } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { user: null },
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
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
