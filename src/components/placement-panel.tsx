"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, ExternalLink } from "lucide-react";
import { getMessages, t } from "@/i18n/get-messages";
import type { AggregatedPlacement } from "@/lib/aggregate-placement";

type Props = {
  locale?: "vi" | "en";
  /** When set, list only that product source (ielts, cambridge, …). */
  source?: string;
  title?: string;
  lead?: string;
  /** When true, omit the navy hero (parent hub already shows one). */
  hideHero?: boolean;
};

type BranchFilter = "" | "NTL" | "XVNT";

function formatVnDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  const date = d.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(-2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export function PlacementPanel({
  locale = "vi",
  source,
  title,
  lead,
  hideHero = false,
}: Props) {
  const m = getMessages(locale);
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState<BranchFilter>("");
  const [data, setData] = useState<AggregatedPlacement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (branch) params.set("branch", branch);
      if (source === "ielts" || source === "cambridge") {
        params.set("source", source);
      } else if (source) {
        params.set("source", "ielts");
      }
      params.set("take", "50");
      const res = await fetch(`/api/placement?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await res.json()) as AggregatedPlacement & {
        code?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(body.code || body.error || "SERVER_ERROR");
        setData(null);
        return;
      }
      setData(body);
    } catch {
      setError("FETCH_FAILED");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q, branch, source]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, q ? 300 : 0);
    return () => window.clearTimeout(handle);
  }, [load, q]);

  const total = data?.stats.total ?? 0;
  const ntl = data?.stats.byBranch.NTL ?? 0;
  const xvnt = data?.stats.byBranch.XVNT ?? 0;
  const heading = title || t(m, "placementTitle");
  const subtitle = lead || t(m, "placementLead");

  return (
    <div className="space-y-5">
      {!hideHero ? (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-wewin-navy via-[#142852] to-wewin-navy-hover px-5 py-6 text-white sm:px-7 sm:py-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wewin-gold-soft">
            WeWIN · NTL & XVNT
            {source ? ` · ${source.toUpperCase()}` : ""}
          </p>
          <h1 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
            {heading}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">{subtitle}</p>
          <ClipboardList
            className="pointer-events-none absolute right-8 top-1/2 hidden h-16 w-16 -translate-y-1/2 text-wewin-gold/40 sm:block"
            aria-hidden
          />
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: t(m, "statsTotal"), value: total },
          { label: t(m, "statsNtl"), value: ntl },
          { label: t(m, "statsXvnt"), value: xvnt },
        ].map((card) => (
          <div
            key={card.label}
            className="flex min-h-[72px] items-center gap-3 rounded-xl border border-wewin-border bg-white px-4 py-3 shadow-sm"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-wewin-accent-blue-bg text-wewin-navy">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-zinc-500">
                {card.label}
              </span>
              <strong className="block text-2xl font-bold tabular-nums text-zinc-900">
                {loading && !data ? "…" : card.value}
              </strong>
            </div>
          </div>
        ))}
      </section>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <section className="min-w-0 rounded-xl border border-wewin-border bg-white shadow-sm">
        <header className="border-b border-wewin-border px-4 py-4 sm:px-5">
          <h2 className="text-lg font-bold text-zinc-900">
            {t(m, "listTitle")}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">{t(m, "listHint")}</p>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-wewin-border px-4 py-3 sm:px-5">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(m, "searchPlaceholder")}
            aria-label={t(m, "searchPlaceholder")}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue/20"
          />
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value as BranchFilter)}
            aria-label={t(m, "allBranches")}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">{t(m, "allBranches")}</option>
            <option value="NTL">NTL</option>
            <option value="XVNT">XVNT</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-wewin-navy px-3 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
          >
            {t(m, "refresh")}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-2.5">{t(m, "colStudent")}</th>
                <th className="px-3 py-2.5">{t(m, "colBranch")}</th>
                <th className="px-3 py-2.5">{t(m, "colTest")}</th>
                <th className="px-3 py-2.5">{t(m, "colFinished")}</th>
                <th className="px-3 py-2.5">{t(m, "colScore")}</th>
                <th className="px-4 py-2.5 text-right">{t(m, "colDetail")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    {t(m, "loading")}
                  </td>
                </tr>
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    {t(m, "empty")}
                  </td>
                </tr>
              ) : (
                data.items.map((row) => {
                  const { date, time } = formatVnDateTime(row.finishedAt);
                  const score =
                    row.scoreCorrect != null && row.scoreTotal != null
                      ? `${row.scoreCorrect}/${row.scoreTotal}`
                      : row.scoreCorrect != null
                        ? String(row.scoreCorrect)
                        : "—";
                  return (
                    <tr
                      key={`${row.source}-${row.id}`}
                      className="border-t border-zinc-100 hover:bg-zinc-50/80"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-800"
                            aria-hidden
                          >
                            {initials(row.studentName)}
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate text-zinc-900">
                              {row.studentName}
                            </strong>
                            <span className="block text-xs text-zinc-500">
                              {row.externalId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            row.branch === "XVNT"
                              ? "bg-violet-50 text-violet-800"
                              : "bg-sky-50 text-sky-800"
                          }`}
                        >
                          {row.branch}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <strong className="font-semibold text-zinc-900">
                          {row.testLabel}
                        </strong>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {date}
                        <span className="block text-xs text-zinc-500">
                          {time}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-bold tabular-nums text-emerald-800">
                          {score}
                        </span>
                        {row.scorePercent != null ? (
                          <span className="block text-xs text-zinc-500">
                            {Math.round(row.scorePercent)}%
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <a
                          href={row.detailUrl || `#`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-wewin-navy hover:underline"
                        >
                          {t(m, "viewDetail")}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
