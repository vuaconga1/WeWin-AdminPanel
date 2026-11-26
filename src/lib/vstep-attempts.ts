import { z } from "zod";

export type VstepAttemptStatus = "active" | "submitted" | "expired";

export type HubVstepAttemptItem = {
  id: string;
  studentName: string;
  studentEmail: string | null;
  ownerKind: "user" | "guest";
  examTitle: string;
  practiceLabel: string;
  catalog: string;
  status: VstepAttemptStatus;
  startedAt: string | null;
  submittedAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
  listeningScore: number | null;
  readingScore: number | null;
  writingStatus: string;
  speakingStatus: string;
  detailUrl: string;
};

export type VstepAttemptsResult = {
  generatedAt: string;
  items: HubVstepAttemptItem[];
  stats: {
    total: number;
    submitted: number;
    active: number;
    expired: number;
  };
  source: { ok: boolean; error?: string };
};

const querySchema = z.object({
  q: z.string().max(100).optional(),
  status: z.enum(["all", "active", "submitted", "expired"]).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).max(10000).optional(),
});

export type VstepAttemptsQuery = z.infer<typeof querySchema>;

export function parseVstepAttemptsQuery(
  raw: Record<string, string>,
): { ok: true; data: VstepAttemptsQuery } | { ok: false; error: string } {
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  return { ok: true, data: parsed.data };
}

function hubKey(): string | null {
  const key = process.env.WEWIN_HUB_API_KEY?.trim();
  return key && key.length >= 16 ? key : null;
}

function vstepHubUrl(): string {
  return (
    process.env.VSTEP_HUB_URL?.trim() ||
    "https://vstep.wewin.edu.vn/api/hub/vstep-attempts"
  );
}

function vstepPublicOrigin(): string {
  const fromEnv = process.env.VSTEP_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  try {
    return new URL(vstepHubUrl()).origin;
  } catch {
    return "https://vstep.wewin.edu.vn";
  }
}

type RemoteList = {
  items?: HubVstepAttemptItem[];
  stats?: {
    total?: number;
    submitted?: number;
    active?: number;
    expired?: number;
  };
  generatedAt?: string;
};

/**
 * AdminPanel BFF → vstep.wewin.edu.vn hub (Bearer WEWIN_HUB_API_KEY).
 */
export async function fetchVstepAttempts(
  query: VstepAttemptsQuery,
): Promise<VstepAttemptsResult> {
  const key = hubKey();
  if (!key) {
    return {
      generatedAt: new Date().toISOString(),
      items: [],
      stats: { total: 0, submitted: 0, active: 0, expired: 0 },
      source: { ok: false, error: "HUB_KEY_NOT_CONFIGURED" },
    };
  }

  const url = new URL(vstepHubUrl());
  if (query.q) url.searchParams.set("q", query.q);
  url.searchParams.set(
    "status",
    query.status && query.status !== "all" ? query.status : "all",
  );
  url.searchParams.set("take", String(query.take ?? 50));
  if (query.offset) url.searchParams.set("offset", String(query.offset));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        code?: string;
      } | null;
      return {
        generatedAt: new Date().toISOString(),
        items: [],
        stats: { total: 0, submitted: 0, active: 0, expired: 0 },
        source: {
          ok: false,
          error: body?.code || `HTTP_${res.status}`,
        },
      };
    }
    const data = (await res.json()) as RemoteList;
    const origin = vstepPublicOrigin();
    const items = (data.items ?? []).map((row) => ({
      ...row,
      detailUrl:
        row.detailUrl?.trim() ||
        `${origin}/manage/vstep/history/${encodeURIComponent(row.id)}`,
    }));
    return {
      generatedAt: data.generatedAt || new Date().toISOString(),
      items,
      stats: {
        total: data.stats?.total ?? items.length,
        submitted:
          data.stats?.submitted ??
          items.filter((i) => i.status === "submitted").length,
        active:
          data.stats?.active ??
          items.filter((i) => i.status === "active").length,
        expired:
          data.stats?.expired ??
          items.filter((i) => i.status === "expired").length,
      },
      source: { ok: true },
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      generatedAt: new Date().toISOString(),
      items: [],
      stats: { total: 0, submitted: 0, active: 0, expired: 0 },
      source: { ok: false, error: aborted ? "TIMEOUT" : "FETCH_FAILED" },
    };
  } finally {
    clearTimeout(timer);
  }
}
