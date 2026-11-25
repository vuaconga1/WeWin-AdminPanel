import { redirect } from "next/navigation";
import { getSessionUser, isAdminRole } from "@/lib/session";
import { buildIeltsSsoLoginUrl } from "@/lib/sso";

/**
 * Guard RSC pages. Prefer IELTS SSO redirect when configured so one
 * wewin_session works across AdminPanel + product sites.
 */
export async function requireAdminPage(returnPath: string) {
  const user = await getSessionUser();
  if (user && isAdminRole(user.role)) {
    return user;
  }

  const path = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
  const next = encodeURIComponent(path);

  // Logged-in non-admin: do not bounce to IdP (would loop). Show login.
  if (user && !isAdminRole(user.role)) {
    redirect(`/login?next=${next}&error=ADMIN_REQUIRED`);
  }

  const ssoUrl = buildIeltsSsoLoginUrl(path);
  if (ssoUrl) {
    redirect(ssoUrl);
  }

  redirect(`/login?next=${next}`);
}
