import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { firstZodCode, loginBodySchema } from "@/lib/auth-credentials";
import { prisma } from "@/lib/db";
import { issueLocalSession } from "@/lib/issue-session";
import { isAdminRole } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Local admin login against AdminPanel PostgreSQL (independent of IELTS).
 */
export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = loginBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { code: firstZodCode(parsed.error) },
      { status: 400 },
    );
  }

  const identifier = parsed.data.email;
  const user = identifier.includes("@")
    ? await prisma.adminUser.findUnique({
        where: { email: identifier },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          passwordHash: true,
        },
      })
    : await prisma.adminUser.findUnique({
        where: { username: identifier },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          passwordHash: true,
        },
      });

  if (!user) {
    return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const ok = await compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  if (!isAdminRole(user.role)) {
    return NextResponse.json({ code: "ADMIN_REQUIRED" }, { status: 403 });
  }

  await issueLocalSession({
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
}
