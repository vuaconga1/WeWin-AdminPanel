"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  ExternalLink,
  FolderOpen,
  Gamepad2,
  GraduationCap,
  Headphones,
  MessageSquare,
  Monitor,
  TrendingUp,
} from "lucide-react";
import { FastbotsChats } from "@/components/fastbots-chats";
import type { AggregatedPlacement } from "@/lib/aggregate-placement";

type BranchFilter = "" | "NTL" | "XVNT";
type SourceTab = "ielts" | "cambridge";
type HubSection = "placement" | "chats" | "sale-pipeline";

const PLATFORMS = [
  {
    title: "IELTS",
    desc: "Luyện thi & placement IELTS",
    href: "https://ielts.wewin.edu.vn/",
    Icon: Headphones,
  },
  {
    title: "Cambridge Placement",
    desc: "Placement Cambridge / Junior",
    href: "https://cambridge-placement-test.vercel.app/",
    Icon: GraduationCap,
  },
  {
    title: "Games Library",
    desc: "Trò chơi học tập",
    href: "https://gameslib.wewin.edu.vn/",
    Icon: Gamepad2,
  },
  {
    title: "Storyland",
    desc: "Đọc hiểu & story",
    href: "https://exam.wewin.edu.vn/?screen=storyland",
    Icon: BookOpen,
  },
  {
    title: "E-learning",
    desc: "Hệ thống học trực tuyến",
    href: "https://elearning.wewin.edu.vn/",
    Icon: Monitor,
  },
] as const;

const MATERIAL_URL =
  "https://wewin.edu.vn/all-material-for-wewin-education/";

function cambridgeSourceMessage(code: string | undefined): string {
  if (code === "CAMBRIDGE_HUB_NOT_CONFIGURED") {
    return "Chưa cấu hình CAMBRIDGE_HUB_URL / WEWIN_HUB_API_KEY.";
  }
  if (code === "ADMIN_REQUIRED") {
    return "Cambridge từ chối key (kiểm tra WEWIN_HUB_API_KEY giống nhau trên cả hai site).";
  }
  if (code === "AbortError" || /aborted|timeout|TIMEOUT/i.test(code || "")) {
    return "Hết thời gian chờ khi gọi Cambridge.";
  }
  if (code?.includes("LOCAL_FALLBACK")) {
    return "Cambridge hub lỗi — đang dùng dữ liệu local AdminPanel.";
  }
  return "Không lấy được dữ liệu Cambridge (kiểm tra WEWIN_HUB_API_KEY trên cả hai site).";
}

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

export function HubHome() {
  const [section, setSection] = useState<HubSection>("placement");
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState<BranchFilter>("");
  const [sourceTab, setSourceTab] = useState<SourceTab>("ielts");
  const [data, setData] = useState<AggregatedPlacement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (section !== "placement") return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (branch) params.set("branch", branch);
      params.set("source", sourceTab);
      params.set("take", "50");
      const res = await fetch(`/api/placement?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await res.json().catch(() => null)) as
        | AggregatedPlacement
        | { code?: string; error?: string }
        | null;
      if (!res.ok) {
        setError(
          (body as { code?: string } | null)?.code ||
            (body as { error?: string } | null)?.error ||
            "Không tải được danh sách placement.",
        );
        setData(null);
        return;
      }
      setData(body as AggregatedPlacement);
    } catch {
      setError("Không tải được danh sách placement.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [branch, query, section, sourceTab]);

  useEffect(() => {
    if (section !== "placement") return;
    const handle = window.setTimeout(() => {
      void load();
    }, query ? 300 : 0);
    return () => window.clearTimeout(handle);
  }, [load, query, section]);

  const total = data?.stats.total ?? 0;
  const ntl = data?.stats.byBranch.NTL ?? 0;
  const xvnt = data?.stats.byBranch.XVNT ?? 0;

  const ieltsSource = data?.sources.ielts;
  const cambridgeSource = data?.sources.cambridge;
  const showIeltsFail =
    sourceTab === "ielts" && ieltsSource && !ieltsSource.ok;
  const showIeltsFallback =
    sourceTab === "ielts" &&
    ieltsSource?.ok &&
    Boolean(ieltsSource.error);
  const showCambridgeFail =
    sourceTab === "cambridge" && cambridgeSource && !cambridgeSource.ok;
  const showCambridgeFallback =
    sourceTab === "cambridge" &&
    cambridgeSource?.ok &&
    Boolean(cambridgeSource.error);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-wewin-navy via-[#142852] to-wewin-navy-hover px-5 py-6 text-white sm:px-7 sm:py-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wewin-gold-soft">
          WeWIN · NTL & XVNT
        </p>
        <h1 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
          {section === "chats"
            ? "Chat History · Fastbots"
            : section === "sale-pipeline"
              ? "Sale Pipeline"
              : "Kết quả Placement Test"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          {section === "chats"
            ? "Xem hội thoại chatbot tư vấn (đồng bộ webhook). Chi tiết đầy đủ vẫn trên Fastbots."
            : section === "sale-pipeline"
              ? "Tổng quan doanh thu và lead theo cơ sở NTL & XVNT. Mặc định mở Tổng quan."
              : "Tra cứu bài kiểm tra đầu vào từ IELTS và Cambridge. Chi tiết mở trên web gốc."}
        </p>
        {section === "chats" ? (
          <MessageSquare
            className="pointer-events-none absolute right-8 top-1/2 hidden h-16 w-16 -translate-y-1/2 text-wewin-gold/40 sm:block"
            aria-hidden
          />
        ) : section === "sale-pipeline" ? (
          <TrendingUp
            className="pointer-events-none absolute right-8 top-1/2 hidden h-16 w-16 -translate-y-1/2 text-wewin-gold/40 sm:block"
            aria-hidden
          />
        ) : (
          <ClipboardList
            className="pointer-events-none absolute right-8 top-1/2 hidden h-16 w-16 -translate-y-1/2 text-wewin-gold/40 sm:block"
            aria-hidden
          />
        )}
      </section>

      <div
        role="tablist"
        aria-label="Khu vực Admin Panel"
        className="flex flex-wrap gap-2"
      >
        {(
          [
            {
              id: "placement" as const,
              label: "Placement",
              Icon: ClipboardList,
            },
            {
              id: "chats" as const,
              label: "Chat History",
              Icon: MessageSquare,
            },
            {
              id: "sale-pipeline" as const,
              label: "Sale Pipeline",
              Icon: TrendingUp,
            },
          ] as const
        ).map((tab) => {
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSection(tab.id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-wewin-navy text-white"
                  : "border border-wewin-border bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              <tab.Icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      {section === "chats" ? <FastbotsChats hideHero /> : null}

      {section === "sale-pipeline" ? (
        <section className="overflow-hidden rounded-xl border border-wewin-border bg-white shadow-sm">
          <iframe
            title="Sale Pipeline WeWIN"
            src="/admin/sale-pipeline/view"
            referrerPolicy="no-referrer"
            className="block w-full border-0"
            style={{
              height: "calc(100dvh - 220px)",
              minHeight: 520,
            }}
          />
        </section>
      ) : null}

      {section === "placement" ? (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Tổng lượt thi", value: total },
              { label: "Lượt thi NTL", value: ntl },
              { label: "Lượt thi XVNT", value: xvnt },
            ].map((m) => (
              <div
                key={m.label}
                className="flex min-h-[72px] items-center gap-3 rounded-xl border border-wewin-border bg-white px-4 py-3 shadow-sm"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-wewin-accent-blue-bg text-wewin-navy">
                  <ClipboardList className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-zinc-500">
                    {m.label}
                  </span>
                  <strong className="block text-2xl font-bold tabular-nums text-zinc-900">
                    {loading && !data ? "…" : m.value}
                  </strong>
                </div>
              </div>
            ))}
          </section>

          {showIeltsFail ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Không lấy được dữ liệu IELTS.
            </div>
          ) : null}
          {showIeltsFallback ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              IELTS hub lỗi — đang dùng dữ liệu local AdminPanel.
            </div>
          ) : null}
          {showCambridgeFail ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {cambridgeSourceMessage(cambridgeSource?.error)}
            </div>
          ) : null}
          {showCambridgeFallback ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {cambridgeSourceMessage(cambridgeSource?.error)}
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <section className="min-w-0 rounded-xl border border-wewin-border bg-white shadow-sm">
              <header className="border-b border-wewin-border px-4 py-4 sm:px-5">
                <h2 className="text-lg font-bold text-zinc-900">
                  Danh sách lượt thi
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Thời gian nộp bài theo giờ Việt Nam (UTC+7).
                </p>
              </header>

              <div
                role="tablist"
                aria-label="Nguồn dữ liệu"
                className="flex gap-1 border-b border-wewin-border px-4 pt-3 sm:px-5"
              >
                {(
                  [
                    { id: "ielts" as const, label: "IELTS" },
                    { id: "cambridge" as const, label: "Cambridge" },
                  ] as const
                ).map((tab) => {
                  const active = sourceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSourceTab(tab.id)}
                      className={`min-h-10 rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-wewin-navy text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 border-b border-wewin-border px-4 py-3 sm:px-5">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm tên hoặc mã lượt thi"
                  aria-label="Tìm tên hoặc mã lượt thi"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue/20"
                />
                <select
                  value={branch}
                  onChange={(e) =>
                    setBranch(e.target.value as BranchFilter)
                  }
                  aria-label="Lọc cơ sở"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Tất cả cơ sở</option>
                  <option value="NTL">NTL</option>
                  <option value="XVNT">XVNT</option>
                </select>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-lg bg-wewin-navy px-3 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
                >
                  Làm mới
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-2.5">Học viên</th>
                      <th className="px-3 py-2.5">Cơ sở</th>
                      <th className="px-3 py-2.5">Bài kiểm tra</th>
                      <th className="px-3 py-2.5">Ngày giờ nộp</th>
                      <th className="px-3 py-2.5">Kết quả</th>
                      <th className="px-4 py-2.5 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && !data ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-zinc-500"
                        >
                          Đang tải…
                        </td>
                      </tr>
                    ) : !data?.items.length ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-zinc-500"
                        >
                          Không tìm thấy lượt thi phù hợp.
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
                                Xem bài
                                <ExternalLink
                                  className="h-3.5 w-3.5"
                                  aria-hidden
                                />
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

            <aside className="space-y-4">
              <section className="rounded-xl border border-wewin-border bg-white shadow-sm">
                <header className="px-4 py-3">
                  <h2 className="text-base font-bold text-zinc-900">
                    Trang học tập
                  </h2>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    Các nền tảng của WeWIN
                  </p>
                </header>
                <div className="px-2 pb-3">
                  {PLATFORMS.map(({ title, desc, href, Icon }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-50"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-wewin-accent-blue-bg text-wewin-navy">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-xs text-zinc-900">
                          {title}
                        </strong>
                        <span className="block text-[10px] text-zinc-500">
                          {desc}
                        </span>
                      </span>
                      <ExternalLink
                        className="h-3.5 w-3.5 shrink-0 text-zinc-400"
                        aria-hidden
                      />
                    </a>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
                <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-800">
                  <FolderOpen className="h-4 w-4" aria-hidden />
                </div>
                <h2 className="text-base font-bold text-zinc-900">
                  Teaching Resource
                </h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Giáo trình và tài liệu theo chương trình dành cho giáo viên.
                </p>
                <a
                  href={MATERIAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                >
                  Mở trang Material
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </section>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}
