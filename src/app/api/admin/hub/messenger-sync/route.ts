import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { isMessengerConfigured } from "@/lib/messenger/config";
import { MessengerGraphError } from "@/lib/messenger/graph";
import { syncMessengerConversations } from "@/lib/messenger/store";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json(
      { code: auth.code },
      { status: auth.status, headers: NO_STORE },
    );
  }

  if (!isMessengerConfigured()) {
    return NextResponse.json(
      { code: "MESSENGER_NOT_CONFIGURED" },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const result = await syncMessengerConversations({ limit: 30 });
    return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof MessengerGraphError) {
      return NextResponse.json(
        { code: error.code, detail: error.message },
        { status: error.status, headers: NO_STORE },
      );
    }
    console.error("[admin/hub/messenger-sync]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
