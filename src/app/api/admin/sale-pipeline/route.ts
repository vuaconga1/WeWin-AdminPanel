import { createSalePipelineHandler } from "@/server/sale-pipeline-server.mjs";
import { requireAdminApi } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAdminRequest(_request: Request): Promise<boolean> {
  const auth = await requireAdminApi();
  return auth.ok === true;
}

export const GET = createSalePipelineHandler(isAdminRequest);
