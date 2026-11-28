import { receiveSaleSnapshot } from "@/server/sale-pipeline-server.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = receiveSaleSnapshot;
