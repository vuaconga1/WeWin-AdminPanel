import { getSessionUser, isAdminRole, type SessionUser } from "@/lib/session";

export async function requireAdminApi(): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; status: 401 | 403; code: string }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, status: 401, code: "LOGIN_REQUIRED" };
  if (!isAdminRole(user.role)) {
    return { ok: false, status: 403, code: "ADMIN_REQUIRED" };
  }
  return { ok: true, user };
}
