import { redirect } from "next/navigation";
import { getSessionUser, isAdminRole } from "@/lib/session";

/**
 * Guard RSC pages. Unauthenticated users go to local /login;
 * successful login issues wewin_session shared across WeWIN sites.
 */
export async function requireAdminPage(returnPath: string) {
  const user = await getSessionUser();
  if (user && isAdminRole(user.role)) {
    return user;
  }

  const path = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
  const next = encodeURIComponent(path);

  if (user && !isAdminRole(user.role)) {
    redirect(`/login?next=${next}&error=ADMIN_REQUIRED`);
  }

  redirect(`/login?next=${next}`);
}
