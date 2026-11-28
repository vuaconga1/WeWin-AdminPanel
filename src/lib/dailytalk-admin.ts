import { z } from "zod";

export type DailyTalkSection = "overview" | "learners" | "staff" | "activity";

export type DailyTalkOverview = {
  generatedAt: string;
  section: "overview";
  stats: { leads: number; active: number; paused: number; support: number };
  supportPreview: Array<{
    id: string;
    name: string;
    consultantName: string | null;
    supportReasons: string[];
  }>;
};

export type DailyTalkLearner = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  packageName: string | null;
  activatedAt: string | null;
  accessEndsAt: string | null;
  createdAt: string;
  lastStudied: string | null;
  sessionsDone: number;
  supportReasons: string[];
  zaloWarning: string | null;
  consultant: { id: string; name: string } | null;
};

export type DailyTalkLearners = {
  generatedAt: string;
  section: "learners";
  items: DailyTalkLearner[];
  total: number;
};

export type DailyTalkStaff = {
  generatedAt: string;
  section: "staff";
  items: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    learnerCount: number;
  }>;
};

export type DailyTalkActivityEntry = {
  id: string;
  action: string;
  label: string;
  detail: string | null;
  ip: string | null;
  createdAt: string;
};

export type DailyTalkActivity = {
  generatedAt: string;
  section: "activity";
  groups: Array<{
    key: string;
    userId: string | null;
    learnerId: string | null;
    userName: string;
    userEmail: string;
    total: number;
    latest: DailyTalkActivityEntry;
    older: DailyTalkActivityEntry[];
  }>;
};

export type DailyTalkAdminResult =
  | ({ source: { ok: true } } & DailyTalkOverview)
  | ({ source: { ok: true } } & DailyTalkLearners)
  | ({ source: { ok: true } } & DailyTalkStaff)
  | ({ source: { ok: true } } & DailyTalkActivity)
  | {
      generatedAt: string;
      section: DailyTalkSection;
      source: { ok: false; error: string };
      stats?: DailyTalkOverview["stats"];
      supportPreview?: DailyTalkOverview["supportPreview"];
      items?: unknown[];
      total?: number;
      groups?: DailyTalkActivity["groups"];
    };

const querySchema = z.object({
  section: z.enum(["overview", "learners", "staff", "activity"]).default("overview"),
  q: z.string().max(100).optional(),
  filter: z.string().max(40).optional(),
  sort: z.string().max(40).optional(),
  c: z.string().max(80).optional(),
  from: z.string().max(20).optional(),
  to: z.string().max(20).optional(),
  take: z.coerce.number().int().min(1).max(800).optional(),
});

export type DailyTalkAdminQuery = z.infer<typeof querySchema>;

export function parseDailyTalkAdminQuery(
  raw: Record<string, string>,
): { ok: true; data: DailyTalkAdminQuery } | { ok: false; error: string } {
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  return { ok: true, data: parsed.data };
}

function hubKey(): string | null {
  const key = process.env.WEWIN_HUB_API_KEY?.trim();
  return key && key.length >= 16 ? key : null;
}

function dailyTalkHubUrl(): string {
  return (
    process.env.DAILYTALK_HUB_URL?.trim() ||
    "https://dailytalk.wewin.edu.vn/api/hub/admin"
  );
}

export function dailyTalkPublicOrigin(): string {
  const fromEnv = process.env.DAILYTALK_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  try {
    return new URL(dailyTalkHubUrl()).origin;
  } catch {
    return "https://dailytalk.wewin.edu.vn";
  }
}

/**
 * AdminPanel BFF → dailytalk.wewin.edu.vn hub (Bearer WEWIN_HUB_API_KEY).
 */
export async function fetchDailyTalkAdmin(
  query: DailyTalkAdminQuery,
): Promise<DailyTalkAdminResult> {
  const generatedAt = new Date().toISOString();
  const section = query.section;
  const empty = (error: string): DailyTalkAdminResult => ({
    generatedAt,
    section,
    source: { ok: false, error },
    stats: { leads: 0, active: 0, paused: 0, support: 0 },
    supportPreview: [],
    items: [],
    total: 0,
    groups: [],
  });

  const key = hubKey();
  if (!key) return empty("HUB_KEY_NOT_CONFIGURED");

  const url = new URL(dailyTalkHubUrl());
  url.searchParams.set("section", section);
  if (query.q) url.searchParams.set("q", query.q);
  if (query.filter) url.searchParams.set("filter", query.filter);
  if (query.sort) url.searchParams.set("sort", query.sort);
  if (query.c) url.searchParams.set("c", query.c);
  if (query.from) url.searchParams.set("from", query.from);
  if (query.to) url.searchParams.set("to", query.to);
  if (query.take) url.searchParams.set("take", String(query.take));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
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
      const body = (await res.json().catch(() => null)) as { code?: string } | null;
      return empty(body?.code || `HUB_HTTP_${res.status}`);
    }
    const body = (await res.json()) as Record<string, unknown>;
    return { ...body, source: { ok: true } } as DailyTalkAdminResult;
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return empty(aborted ? "HUB_TIMEOUT" : "HUB_FETCH_FAILED");
  } finally {
    clearTimeout(timer);
  }
}
