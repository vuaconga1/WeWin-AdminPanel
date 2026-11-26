"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, ExternalLink } from "lucide-react";
import type { ExamAttemptsResult } from "@/lib/exam-attempts";

type Props = {
  title?: string;
  lead?: string;
};

type StatusFilter = "all" | "draft" | "submitted";

function formatVnDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "—", time: "" };
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

export function ExamPanel({
  title = "Lịch sử luyện thi · Exam",
  lead = "Bài làm từ exam.wewin.edu.vn",
}: Props) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [data, setData] = useState<ExamAttemptsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status !== "all") params.set("status", status);
      params.set("take", "50");
      const res = await fetch(`/api/exam-attempts?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await res.json()) as ExamAttemptsResult & {
        code?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(body.code || body.error || "SERVER_ERROR");
        setData(null);
        return;
      }
      setData(body);
      if (!body.source?.ok) {
        setError(body.source?.error || "EXAM_HUB_FAILED");
      }
    } catch {
      setError("FETCH_FAILED");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, q ? 300 : 0);
    return () => window.clearTimeout(handle);
  }, [load, q]);

  const total = data?.stats.total ?? 0;
  const submitted = data?.stats.submitted ?? 0;
  const draft = data?.stats.draft ?? 0;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-wewin-navy via-[#142852] to-wewin-navy-hover px-5 py-6 text-white sm:px-7 sm:py-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wewin-gold-soft">
          WeWIN · Exam
        </p>
        <h1 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">{lead}</p>
        <ClipboardList
          className="pointer-events-none absolute right-8 top-1/2 hidden h-16 w-16 -translate-y-1/2 text-wewin-gold/40 sm:block"
          aria-hidden
        />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Tổng lượt", value: total },
          { label: "Đã nộp", value: submitted },
          { label: "Đang làm", value: draft },
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
          {error === "HUB_KEY_NOT_CONFIGURED"
            ? "Chưa cấu hình WEWIN_HUB_API_KEY."
            : error === "UNAUTHORIZED" || error === "HTTP_401"
              ? "Exam từ chối key (kiểm tra WEWIN_HUB_API_KEY giống nhau trên exam + Admin Panel)."
              : error === "TIMEOUT"
                ? "Hết thời gian chờ khi gọi Exam hub."
                : `Không lấy được dữ liệu Exam (${error}).`}
        </p>
      ) : null}

      <section className="min-w-0 rounded-xl border border-wewin-border bg-white shadow-sm">
        <header className="border-b border-wewin-border px-4 py-4 sm:px-5">
          <h2 className="text-lg font-bold text-zinc-900">Nhật ký bài làm</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Bài làm của học viên và khách đã đăng ký trên exam.wewin.edu.vn
          </p>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-wewin-border px-4 py-3 sm:px-5">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên, mã HV hoặc mã đề"
            aria-label="Tìm kiếm"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue/20"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            aria-label="Trạng thái"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Tất cả bài làm</option>
            <option value="draft">Đang làm</option>
            <option value="submitted">Đã nộp</option>
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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-2.5">Thời gian</th>
                <th className="px-3 py-2.5">Học viên</th>
                <th className="px-3 py-2.5">Bài luyện</th>
                <th className="px-3 py-2.5">Trạng thái</th>
                <th className="px-3 py-2.5">Điểm</th>
                <th className="px-4 py-2.5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    Đang tải…
                  </td>
                </tr>
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    Không tìm thấy bài làm phù hợp.
                  </td>
                </tr>
              ) : (
                data.items.map((row) => {
                  const started = formatVnDateTime(row.startedAt);
                  const submittedAt = formatVnDateTime(row.submittedAt);
                  const score =
                    row.scoreTotal != null
                      ? `${row.scoreTotal}/${row.scoreMax || 100}`
                      : "—";
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-zinc-100 hover:bg-zinc-50/80"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5">
                        {started.date} {started.time}
                        <span className="block text-xs text-zinc-500">
                          Bắt đầu
                          {row.submittedAt
                            ? ` · Nộp: ${submittedAt.date} ${submittedAt.time}`
                            : ""}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
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
                              {row.externalId || "Guest"}
                              {row.ownerKind === "guest" ? " · Khách" : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <strong className="font-semibold text-zinc-900">
                          {row.examTitle}
                        </strong>
                        {(row.examLevel || row.examNumber) && (
                          <span className="block text-xs text-zinc-500">
                            {[row.examLevel, row.examNumber]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            row.status === "submitted"
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-sky-50 text-sky-800"
                          }`}
                        >
                          {row.status === "submitted"
                            ? "Đã nộp bài"
                            : "Đang làm bài"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-bold tabular-nums text-emerald-800">
                          {score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <a
                          href={row.detailUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-wewin-navy hover:underline"
                        >
                          {row.status === "submitted" ? "Xem kết quả" : "Xem bài"}
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
