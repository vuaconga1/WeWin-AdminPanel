import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSessionUser, isAdminRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HTML_PATH = path.join(
  process.cwd(),
  "src",
  "server",
  "sale-pipeline.html",
);

export async function GET(request: Request) {
  const user = await getSessionUser();
  const url = new URL(request.url);
  const next = encodeURIComponent("/admin/sale-pipeline/view");

  if (!user) {
    return Response.redirect(new URL(`/login?next=${next}`, url.origin), 302);
  }
  if (!isAdminRole(user.role)) {
    return Response.redirect(
      new URL(`/login?next=${next}&error=ADMIN_REQUIRED`, url.origin),
      302,
    );
  }

  const html = await readFile(HTML_PATH, "utf8");
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
    },
  });
}
