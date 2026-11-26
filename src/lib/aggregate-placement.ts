import { Prisma, type PlacementBranch } from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { COOKIE_NAME } from "@/lib/session";

export type HubBranch = "NTL" | "XVNT";
export type AggregatedPlacementSource = "ielts" | "cambridge";

export type HubPlacementItem = {
  id: string;
  externalId: string;
  studentName: string;
  branch: HubBranch;
  testLabel: string;
  testSlug: string;
  finishedAt: string;
  scoreCorrect: number | null;
  scoreTotal: number | null;
  scorePercent: number | null;
  detailUrl: string;
  source: AggregatedPlacementSource | string;
};

export type AggregatedPlacement = {
  generatedAt: string;
  items: HubPlacementItem[];
  stats: {
    total: number;
    byBranch: Record<HubBranch, number>;
    bySource: Record<AggregatedPlacementSource, number>;
  };
  sources: {
    ielts: { ok: boolean; error?: string };
    cambridge: { ok: boolean; error?: string };
  };
};

const querySchema = z.object({
  q: z.string().max(100).optional(),
  branch: z.enum(["NTL", "XVNT"]).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  source: z.enum(["ielts", "cambridge", "all"]).optional(),
});

export type PlacementQuery = z.infer<typeof querySchema>;

export function parsePlacementQuery(
  raw: Record<string, string>,
): { ok: true; data: PlacementQuery } | { ok: false; error: string } {
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  return { ok: true, data: parsed.data };
}

function hubKey(): string | null {
  const key = process.env.WEWIN_HUB_API_KEY?.trim();
  return key && key.length >= 16 ? key : null;
}

function ieltsHubUrl(): string {
  return (
    process.env.IELTS_HUB_URL?.trim() ||
    "https://ielts.wewin.edu.vn/api/hub/placement-attempts"
  );
}

function cambridgeHubUrl(): string | null {
  const url = process.env.CAMBRIDGE_HUB_URL?.trim();
  return url || null;
}

/** Browser origin for «Xem bài» (must match cookie host — prefer localhost over 127.0.0.1). */
function ieltsPublicOrigin(): string {
  const fromEnv =
    process.env.IELTS_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_IELTS_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  try {
    return new URL(ieltsHubUrl()).origin;
  } catch {
    return "https://ielts.wewin.edu.vn";
  }
}

function cambridgePublicOrigin(hubUrl: string): string {
  const fromEnv = process.env.CAMBRIDGE_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  try {
    return new URL(hubUrl).origin;
  } catch {
    return hubUrl;
  }
}

function emptyByBranch(): Record<HubBranch, number> {
  return { NTL: 0, XVNT: 0 };
}

/**
 * Build absolute result URL on the product site.
 * Relative hub paths → `{publicOrigin}/practice/{slug}/{id}/result`.
 * Rewrites 127.0.0.1 → localhost when public origin uses localhost (SSO cookie).
 */
function absolutizeDetailUrl(
  detailUrl: string,
  publicOrigin: string,
  fallback?: { slug: string; id: string },
): string {
  const raw = detailUrl?.trim() || "";
  const origin = publicOrigin.replace(/\/$/, "");

  if (!raw && fallback?.slug && fallback.id) {
    return `${origin}/practice/${fallback.slug}/${fallback.id}/result`;
  }
  if (!raw) return raw;

  try {
    const abs = /^https?:\/\//i.test(raw)
      ? new URL(raw)
      : new URL(raw.startsWith("/") ? raw : `/${raw}`, `${origin}/`);

    // Keep path/query from hub; force public origin so session cookie is sent.
    const pub = new URL(origin);
    abs.protocol = pub.protocol;
    abs.host = pub.host;
    return abs.toString();
  } catch {
    return raw;
  }
}

type RemoteList = {
  items?: Array<Omit<HubPlacementItem, "source"> & { source?: string }>;
};

function isLocalHubHost(hubUrl: string): boolean {
  try {
    const host = new URL(hubUrl).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

async function fetchRemoteHub(
  sourceId: AggregatedPlacementSource,
  hubUrl: string,
  publicOrigin: string,
  query: PlacementQuery,
  opts?: { sessionToken?: string | null },
): Promise<{
  items: HubPlacementItem[];
  status: { ok: boolean; error?: string };
}> {
  const key = hubKey();
  const sessionToken = opts?.sessionToken?.trim() || null;
  // IELTS Phase 1: wewin_session cookie. Cambridge (and later IELTS): Bearer.
  if (!key && !sessionToken) {
    return {
      items: [],
      status: { ok: false, error: "HUB_KEY_NOT_CONFIGURED" },
    };
  }

  const url = new URL(hubUrl);
  if (query.q) url.searchParams.set("q", query.q);
  if (query.branch) url.searchParams.set("branch", query.branch);
  if (query.take) url.searchParams.set("take", String(query.take));

  const headers: Record<string, string> = { Accept: "application/json" };
  if (key) headers.Authorization = `Bearer ${key}`;
  if (sessionToken) headers.Cookie = `${COOKIE_NAME}=${sessionToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        code?: string;
      } | null;
      return {
        items: [],
        status: {
          ok: false,
          error: body?.code || `HTTP_${res.status}`,
        },
      };
    }
    const data = (await res.json()) as RemoteList;
    const items = (data.items ?? []).map((row) => {
      // Cambridge staff UI is cookie-gated — open via Admin Panel SSO bridge
      // so operators only sign in once on Admin Panel.
      if (sourceId === "cambridge") {
        return {
          ...row,
          source: sourceId,
          detailUrl: `/api/cambridge-sso?attempt=${encodeURIComponent(row.id)}`,
        };
      }
      return {
        ...row,
        source: sourceId,
        detailUrl: absolutizeDetailUrl(row.detailUrl, publicOrigin, {
          slug: row.testSlug,
          id: row.id,
        }),
      };
    });
    return { items, status: { ok: true } };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      items: [],
      status: { ok: false, error: aborted ? "TIMEOUT" : "FETCH_FAILED" },
    };
  } finally {
    clearTimeout(timer);
  }
}

const leanSelect = {
  id: true,
  externalId: true,
  studentName: true,
  branch: true,
  testLabel: true,
  testSlug: true,
  finishedAt: true,
  scoreCorrect: true,
  scoreTotal: true,
  scorePercent: true,
  detailUrl: true,
  source: true,
} satisfies Prisma.PlacementAttemptSelect;

/** Local AdminPanel DB — used when remote hub is down / not configured. */
async function listLocalPlacement(
  query: PlacementQuery,
  source: AggregatedPlacementSource,
): Promise<HubPlacementItem[]> {
  const take = query.take ?? 50;
  const where: Prisma.PlacementAttemptWhereInput = { source };

  if (query.branch) {
    where.branch = query.branch as PlacementBranch;
  }
  const q = query.q?.trim();
  if (q) {
    where.OR = [
      { studentName: { contains: q, mode: "insensitive" } },
      { externalId: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.placementAttempt.findMany({
    where,
    select: leanSelect,
    orderBy: { finishedAt: "desc" },
    take,
  });

  return rows.map((row) => ({
    id: row.id,
    externalId: row.externalId,
    studentName: row.studentName,
    branch: row.branch,
    testLabel: row.testLabel,
    testSlug: row.testSlug,
    finishedAt: row.finishedAt.toISOString(),
    scoreCorrect: row.scoreCorrect,
    scoreTotal: row.scoreTotal,
    scorePercent: row.scorePercent,
    detailUrl:
      row.detailUrl?.trim() || `/p/${row.source || source}/${row.id}`,
    source: row.source || source,
  }));
}

/**
 * AdminPanel BFF — same contract as wewin-ielts HubPanel:
 * IELTS via forwarded wewin_session (+ optional Bearer); Cambridge via Bearer.
 * Local DB fallback only for localhost hubs (never mask production with seed data).
 */
export async function aggregatePlacement(
  query: PlacementQuery,
): Promise<AggregatedPlacement> {
  const take = query.take ?? 50;
  const sourceFilter = query.source;
  const loadIelts = sourceFilter !== "cambridge";
  const loadCambridge = sourceFilter !== "ielts";
  const jar = await cookies();
  const sessionToken = jar.get(COOKIE_NAME)?.value ?? null;

  const sources: AggregatedPlacement["sources"] = {
    ielts: { ok: false },
    cambridge: { ok: false },
  };

  const items: HubPlacementItem[] = [];

  if (loadIelts) {
    const hubUrl = ieltsHubUrl();
    const remote = await fetchRemoteHub(
      "ielts",
      hubUrl,
      ieltsPublicOrigin(),
      query,
      { sessionToken },
    );
    if (remote.status.ok) {
      sources.ielts = { ok: true };
      items.push(...remote.items);
    } else if (isLocalHubHost(hubUrl)) {
      try {
        const local = await listLocalPlacement(query, "ielts");
        sources.ielts = {
          ok: true,
          error: `${remote.status.error || "REMOTE_FAILED"};LOCAL_FALLBACK`,
        };
        items.push(...local);
      } catch {
        sources.ielts = {
          ok: false,
          error: remote.status.error || "IELTS_HUB_FAILED",
        };
      }
    } else {
      sources.ielts = {
        ok: false,
        error: remote.status.error || "IELTS_HUB_FAILED",
      };
    }
  } else {
    sources.ielts = { ok: true };
  }

  if (loadCambridge) {
    const cambridgeUrl = cambridgeHubUrl();
    if (!cambridgeUrl) {
      try {
        const local = await listLocalPlacement(query, "cambridge");
        sources.cambridge = { ok: true };
        items.push(...local);
      } catch {
        sources.cambridge = {
          ok: false,
          error: "CAMBRIDGE_HUB_NOT_CONFIGURED",
        };
      }
    } else {
      const remote = await fetchRemoteHub(
        "cambridge",
        cambridgeUrl,
        cambridgePublicOrigin(cambridgeUrl),
        query,
        { sessionToken },
      );
      if (remote.status.ok) {
        sources.cambridge = { ok: true };
        items.push(...remote.items);
      } else if (isLocalHubHost(cambridgeUrl)) {
        try {
          const local = await listLocalPlacement(query, "cambridge");
          sources.cambridge = {
            ok: true,
            error: `${remote.status.error || "REMOTE_FAILED"};LOCAL_FALLBACK`,
          };
          items.push(...local);
        } catch {
          sources.cambridge = {
            ok: false,
            error: remote.status.error || "CAMBRIDGE_HUB_FAILED",
          };
        }
      } else {
        sources.cambridge = {
          ok: false,
          error: remote.status.error || "CAMBRIDGE_HUB_FAILED",
        };
      }
    }
  } else {
    sources.cambridge = { ok: true };
  }

  items.sort(
    (a, b) =>
      new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime(),
  );

  const sliced = items.slice(0, take);
  const byBranch = emptyByBranch();
  const bySource: Record<AggregatedPlacementSource, number> = {
    ielts: 0,
    cambridge: 0,
  };
  for (const row of sliced) {
    if (row.branch === "NTL" || row.branch === "XVNT") {
      byBranch[row.branch] += 1;
    }
    if (row.source === "ielts" || row.source === "cambridge") {
      bySource[row.source] += 1;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    items: sliced,
    stats: { total: sliced.length, byBranch, bySource },
    sources,
  };
}
