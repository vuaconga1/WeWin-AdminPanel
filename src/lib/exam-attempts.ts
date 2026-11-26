import { z } from "zod";

export type ExamAttemptStatus = "draft" | "submitted";

export type HubExamAttemptItem = {
  id: string;
  externalId: string;
  studentName: string;
  ownerKind: "user" | "guest";
  examId: string;
  examTitle: string;
  examLevel: string;
  examNumber: string;
  status: ExamAttemptStatus;
  startedAt: string | null;
  submittedAt: string | null;
  scoreTotal: number | null;
  scoreMax: number;
  detailUrl: string;
};

export type ExamAttemptsResult = {
  generatedAt: string;
  items: HubExamAttemptItem[];
  stats: { total: number; submitted: number; draft: number };
  source: { ok: boolean; error?: string };
};

const querySchema = z.object({
  q: z.string().max(100).optional(),
  status: z.enum(["all", "draft", "submitted"]).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).max(10000).optional(),
});

export type ExamAttemptsQuery = z.infer<typeof querySchema>;

export function parseExamAttemptsQuery(
  raw: Record<string, string>,
): { ok: true; data: ExamAttemptsQuery } | { ok: false; error: string } {
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  return { ok: true, data: parsed.data };
}

function hubKey(): string | null {
  const key = process.env.WEWIN_HUB_API_KEY?.trim();
  return key && key.length >= 16 ? key : null;
}

function examHubUrl(): string {
  return (
    process.env.EXAM_HUB_URL?.trim() ||
    "https://exam.wewin.edu.vn/api/hub/exam-attempts"
  );
}

function examPublicOrigin(): string {
  const fromEnv = process.env.EXAM_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  try {
    return new URL(examHubUrl()).origin;
  } catch {
    return "https://exam.wewin.edu.vn";
  }
}

type RemoteList = {
  items?: HubExamAttemptItem[];
  stats?: { total?: number; submitted?: number; draft?: number };
  generatedAt?: string;
};

/**
 * AdminPanel BFF → exam.wewin.edu.vn hub (Bearer WEWIN_HUB_API_KEY).
 */
export async function fetchExamAttempts(
  query: ExamAttemptsQuery,
): Promise<ExamAttemptsResult> {
  const key = hubKey();
  if (!key) {
    return {
      generatedAt: new Date().toISOString(),
      items: [],
      stats: { total: 0, submitted: 0, draft: 0 },
      source: { ok: false, error: "HUB_KEY_NOT_CONFIGURED" },
    };
  }

  const url = new URL(examHubUrl());
  if (query.q) url.searchParams.set("q", query.q);
  if (query.status && query.status !== "all") {
    url.searchParams.set("status", query.status);
  } else {
    url.searchParams.set("status", "all");
  }
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
        stats: { total: 0, submitted: 0, draft: 0 },
        source: {
          ok: false,
          error: body?.code || `HTTP_${res.status}`,
        },
      };
    }
    const data = (await res.json()) as RemoteList;
    const origin = examPublicOrigin();
    const items = (data.items ?? []).map((row) => ({
      ...row,
      detailUrl:
        row.detailUrl?.trim() ||
        `${origin}/?screen=staff&attempt=${encodeURIComponent(row.id)}`,
    }));
    const submitted =
      data.stats?.submitted ??
      items.filter((i) => i.status === "submitted").length;
    const draft =
      data.stats?.draft ?? items.filter((i) => i.status === "draft").length;
    return {
      generatedAt: data.generatedAt || new Date().toISOString(),
      items,
      stats: {
        total: data.stats?.total ?? items.length,
        submitted,
        draft,
      },
      source: { ok: true },
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      generatedAt: new Date().toISOString(),
      items: [],
      stats: { total: 0, submitted: 0, draft: 0 },
      source: { ok: false, error: aborted ? "TIMEOUT" : "FETCH_FAILED" },
    };
  } finally {
    clearTimeout(timer);
  }
}
