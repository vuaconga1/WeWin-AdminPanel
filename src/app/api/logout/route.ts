import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await clearSessionCookies();
  const origin =
    process.env.NEXT_PUBLIC_ADMIN_ORIGIN?.trim() ||
    new URL(request.url).origin;
  return NextResponse.redirect(new URL("/login", origin), 303);
}
