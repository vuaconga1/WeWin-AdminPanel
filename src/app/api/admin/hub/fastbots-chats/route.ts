import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/api-auth";
import { fastbotsChatListQuerySchema } from "@/lib/fastbots/schemas";
import {
  backfillFastbotsConversationsFromRaw,
  listFastbotsConversations,
  upsertFastbotsWebhookPayload,
} from "@/lib/fastbots/store";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

const ingestBodySchema = z.union([
  z.object({
    items: z.array(z.record(z.string(), z.unknown())).min(1).max(100),
  }),
  z.object({
    backfill: z.literal(true),
  }),
]);

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json(
      { code: auth.code },
      { status: auth.status, headers: NO_STORE },
    );
  }

  const url = new URL(request.url);
  const parsed = fastbotsChatListQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_INPUT" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const result = await listFastbotsConversations(parsed.data);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error("[admin/hub/fastbots-chats]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json(
      { code: auth.code },
      { status: auth.status, headers: NO_STORE },
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = ingestBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_INPUT" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    if ("backfill" in parsed.data && parsed.data.backfill) {
      const result = await backfillFastbotsConversationsFromRaw();
      return NextResponse.json(
        { ok: true, ...result },
        { status: 200, headers: NO_STORE },
      );
    }

    const items = "items" in parsed.data ? parsed.data.items : [];
    const result = await upsertFastbotsWebhookPayload(items);
    return NextResponse.json(
      { ok: true, ...result },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error("[admin/hub/fastbots-chats POST]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
