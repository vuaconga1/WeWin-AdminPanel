"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import type {
  DailyTalkActivity,
  DailyTalkAdminResult,
  DailyTalkLearner,
  DailyTalkLearners,
  DailyTalkOverview,
  DailyTalkSection,
  DailyTalkStaff,
} from "@/lib/dailytalk-admin";

type Props = {
  title?: string;
  lead?: string;
  /** DailyTalk public origin for deep-links (server-provided). */
  publicSiteUrl?: string | null;
};

const TABS: { id: DailyTalkSection; label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "learners", label: "Học viên" },
  { id: "staff", label: "Nhân sự" },
  { id: "activity", label: "Nhật ký" },
];

const LEARNER_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "lead", label: "Chờ kích hoạt" },
  { id: "active", label: "Đang học" },
  { id: "support", label: "Cần hỗ trợ" },
  { id: "inactive", label: "Tạm dừng / hết hạn" },
];

const STATUS_LABEL: Record<string, string> = {
  LEAD: "Chờ kích hoạt",
  ACTIVE: "Đang học",
  PAUSED: "Tạm dừng",
  EXPIRED: "Hết hạn",
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  CONSULTANT: "Chuyên viên",
  ACADEMIC: "Học thuật",
};

function formatVnDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function DailyTalkPanel({
  title = "DailyTalk · Quản trị",
  lead = "Dữ liệu từ dailytalk.wewin.edu.vn qua hub API",
  publicSiteUrl,
}: Props) {
  const origin = (publicSiteUrl || "https://dailytalk.wewin.edu.vn").replace(/\/$/, "");
  const [tab, setTab] = useState<DailyTalkSection>("overview");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<DailyTalkAdminResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openActivity, setOpenActivity] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ section: tab });
      if (tab === "learners") {
        if (q.trim()) params.set("q", q.trim());
        if (filter !== "all") params.set("filter", filter);
      }
      if (tab === "activity") {
        if (q.trim()) params.set("q", q.trim());
        if (from) params.set("from", from);
        if (to) params.set("to", to);
      }
      const res = await fetch(`/api/dailytalk-admin?${params.toString()}`, {
        cache: "no-store",
      });
      const body = (await res.json()) as DailyTalkAdminResult & {
        code?: string;
      };
      if (!res.ok) {
        setError(body.code || "SERVER_ERROR");
        setData(null);
        return;
      }
      setData(body);
      if (!body.source?.ok) setError(body.source?.error || "DAILYTALK_HUB_FAILED");
    } catch {
      setError("FETCH_FAILED");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tab, q, filter, from, to]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, q ? 300 : 0);
    return () => window.clearTimeout(handle);
  }, [load, q]);

  function toggleActivity(key: string) {
    setOpenActivity((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const overview = data?.section === "overview" ? (data as DailyTalkOverview) : null;
  const learners = data?.section === "learners" ? (data as DailyTalkLearners) : null;
  const staff = data?.section === "staff" ? (data as DailyTalkStaff) : null;
  const activity = data?.section === "activity" ? (data as DailyTalkActivity) : null;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-wewin-navy via-[#142852] to-wewin-navy-hover px-5 py-6 text-white sm:px-7 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wewin-gold-soft">
              WeWIN · DailyTalk
            </p>
            <h1 className="mt-2 break-words text-2xl font-extrabold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">{lead}</p>
          </div>
          <a
            href={`${origin}/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            Mở site DailyTalk
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </section>

      <nav
        aria-label="DailyTalk admin"
        className="flex min-w-0 flex-wrap gap-1.5 border-b-2 border-wewin-navy/80 pb-px"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex min-h-11 items-center rounded-t-lg border-2 px-3 text-sm font-bold transition sm:px-4 ${
                active
                  ? "-mb-[2px] border-wewin-navy border-b-white bg-white text-wewin-navy"
                  : "border-wewin-navy/70 bg-white/50 text-wewin-navy/80 hover:border-wewin-navy hover:bg-white"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {(tab === "learners" || tab === "activity") && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid min-w-[12rem] flex-1 gap-1 text-xs font-semibold text-wewin-navy">
            {tab === "learners" ? "Tên / email / SĐT" : "Tên / email"}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm…"
              className="rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm outline-none focus:border-wewin-navy"
            />
          </label>
          {tab === "activity" && (
            <>
              <label className="grid gap-1 text-xs font-semibold text-wewin-navy">
                Từ ngày
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm outline-none focus:border-wewin-navy"
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-wewin-navy">
                Đến ngày
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm outline-none focus:border-wewin-navy"
                />
              </label>
            </>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-wewin-border bg-white px-3 text-sm font-semibold text-wewin-navy hover:bg-zinc-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            Làm mới
          </button>
        </div>
      )}

      {tab === "learners" && (
        <div className="flex flex-wrap gap-2">
          {LEARNER_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                filter === f.id
                  ? "bg-wewin-navy text-white"
                  : "border border-wewin-border bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Không lấy được dữ liệu DailyTalk ({error}). Kiểm tra{" "}
          <code className="rounded bg-white/80 px-1">WEWIN_HUB_API_KEY</code> khớp hai phía và{" "}
          <code className="rounded bg-white/80 px-1">DAILYTALK_HUB_URL</code>.
        </div>
      )}

      {loading && !data ? (
        <p className="text-sm text-zinc-500">Đang tải…</p>
      ) : (
        <>
          {tab === "overview" && overview && (
            <OverviewView
              overview={overview}
              onSupportClick={() => {
                setFilter("support");
                setTab("learners");
              }}
              onFilterClick={(f) => {
                setFilter(f);
                setTab("learners");
              }}
              origin={origin}
            />
          )}
          {tab === "learners" && learners && <LearnersView items={learners.items} total={learners.total} origin={origin} />}
          {tab === "staff" && staff && <StaffView items={staff.items} />}
          {tab === "activity" && activity && (
            <ActivityView
              groups={activity.groups}
              open={openActivity}
              onToggle={toggleActivity}
              origin={origin}
            />
          )}
        </>
      )}
    </div>
  );
}

function OverviewView({
  overview,
  onSupportClick,
  onFilterClick,
  origin,
}: {
  overview: DailyTalkOverview;
  onSupportClick: () => void;
  onFilterClick: (filter: string) => void;
  origin: string;
}) {
  const cards = [
    [overview.stats.leads, "Chờ kích hoạt", "lead"],
    [overview.stats.active, "Đang học", "active"],
    [overview.stats.support, "Cần hỗ trợ", "support"],
    [overview.stats.paused, "Tạm dừng / hết hạn", "inactive"],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([value, label, filter]) => (
          <button
            key={label}
            type="button"
            onClick={() => onFilterClick(filter)}
            className="rounded-2xl border border-wewin-border bg-white p-4 text-left shadow-sm transition hover:border-wewin-navy/40"
          >
            <strong className="block text-[25px] text-wewin-navy">{value}</strong>
            <span className="text-xs text-zinc-500">{label}</span>
          </button>
        ))}
      </div>

      <article className="min-w-0 overflow-x-auto rounded-2xl border border-wewin-border bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-wewin-navy">Học viên cần hỗ trợ ngay</h3>
          <button type="button" onClick={onSupportClick} className="text-sm font-semibold text-wewin-navy hover:underline">
            Xem tất cả
          </button>
        </div>
        {overview.supportPreview.length ? (
          <table className="w-full min-w-[32rem] text-left text-sm">
            <tbody>
              {overview.supportPreview.map((l) => (
                <tr key={l.id} className="border-t border-zinc-100">
                  <td className="py-2.5 pr-3">
                    <a
                      href={`${origin}/admin/learners/${l.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-teal-700 hover:underline"
                    >
                      {l.name}
                    </a>
                    <small className="block text-zinc-500">{l.consultantName ?? "Chưa có chuyên viên"}</small>
                  </td>
                  <td className="py-2.5 text-zinc-500">{l.supportReasons.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-zinc-500">Không có học viên nào cần hỗ trợ.</p>
        )}
      </article>
    </div>
  );
}

function LearnersView({
  items,
  total,
  origin,
}: {
  items: DailyTalkLearner[];
  total: number;
  origin: string;
}) {
  return (
    <article className="min-w-0 overflow-x-auto rounded-2xl border border-wewin-border bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-wewin-border px-4 py-3">
        <h3 className="font-bold text-wewin-navy">Danh sách học viên</h3>
        <span className="text-sm text-zinc-500">{total} tài khoản</span>
      </div>
      <table className="w-full min-w-[48rem] text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Học viên</th>
            <th className="px-4 py-3 font-semibold">Trạng thái</th>
            <th className="px-4 py-3 font-semibold">Gói</th>
            <th className="px-4 py-3 font-semibold">Buổi</th>
            <th className="px-4 py-3 font-semibold">Chuyên viên</th>
            <th className="px-4 py-3 font-semibold">Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l.id} className="border-t border-zinc-100">
              <td className="min-w-0 px-4 py-3">
                <div className="break-words font-semibold text-wewin-navy">{l.name}</div>
                <div className="break-words text-xs text-zinc-500">{l.email}</div>
                {l.supportReasons.length > 0 && (
                  <div className="mt-1 text-xs text-amber-700">{l.supportReasons.join(" · ")}</div>
                )}
              </td>
              <td className="px-4 py-3">{STATUS_LABEL[l.status] ?? l.status}</td>
              <td className="min-w-0 break-words px-4 py-3 text-zinc-600">{l.packageName ?? "—"}</td>
              <td className="px-4 py-3">{l.sessionsDone}</td>
              <td className="px-4 py-3 text-zinc-600">{l.consultant?.name ?? "—"}</td>
              <td className="px-4 py-3">
                <a
                  href={`${origin}/admin/learners/${l.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-teal-700 hover:underline"
                >
                  Xem kết quả
                </a>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                Không có học viên phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </article>
  );
}

function StaffView({
  items,
}: {
  items: DailyTalkStaff["items"];
}) {
  return (
    <article className="min-w-0 overflow-x-auto rounded-2xl border border-wewin-border bg-white shadow-sm">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Tên</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Vai trò</th>
            <th className="px-4 py-3 font-semibold">Học viên phụ trách</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className="border-t border-zinc-100">
              <td className="px-4 py-3 font-semibold text-wewin-navy">{s.name}</td>
              <td className="break-words px-4 py-3 text-zinc-500">{s.email}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold">
                  {ROLE_LABEL[s.role] ?? s.role}
                </span>
              </td>
              <td className="px-4 py-3">{s.learnerCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

function ActivityView({
  groups,
  open,
  onToggle,
  origin,
}: {
  groups: DailyTalkActivity["groups"];
  open: Set<string>;
  onToggle: (key: string) => void;
  origin: string;
}) {
  if (!groups.length) {
    return (
      <article className="rounded-2xl border border-wewin-border bg-white px-4 py-10 text-center text-zinc-500 shadow-sm">
        Chưa có nhật ký phù hợp với bộ lọc.
      </article>
    );
  }

  return (
    <div className="grid gap-3">
      {groups.map((group) => {
        const expanded = open.has(group.key);
        return (
          <article key={group.key} className="overflow-hidden rounded-2xl border border-wewin-border bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-base font-extrabold text-wewin-navy sm:text-lg">{group.userName}</h2>
                <p className="break-words text-sm text-zinc-500">{group.userEmail}</p>
                <p className="mt-1 text-xs text-zinc-500">{group.total} hành động</p>
                {group.learnerId && (
                  <a
                    href={`${origin}/admin/learners/${group.learnerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-wewin-navy/20 px-3 text-sm font-semibold text-wewin-navy hover:bg-zinc-50"
                  >
                    Xem kết quả
                  </a>
                )}
              </div>
              <div className="min-w-0 flex-1 sm:max-w-md sm:text-right">
                <div className="font-semibold text-wewin-navy">{group.latest.label}</div>
                <time className="text-xs text-zinc-500" dateTime={group.latest.createdAt}>
                  {formatVnDateTime(group.latest.createdAt)}
                </time>
                {(group.latest.detail || group.latest.ip) && (
                  <p className="mt-0.5 break-words text-xs text-zinc-500">
                    {[group.latest.detail, group.latest.ip ? `IP ${group.latest.ip}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>
            {group.older.length > 0 && (
              <div className="border-t border-zinc-100 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-wewin-navy/20 bg-white px-3 text-sm font-semibold text-wewin-navy hover:bg-zinc-50"
                  aria-expanded={expanded}
                  onClick={() => onToggle(group.key)}
                >
                  <span className={`inline-block transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden>
                    ▾
                  </span>
                  {expanded ? "Thu gọn lịch sử" : `Xem ${group.older.length} hành động cũ hơn`}
                </button>
                {expanded && (
                  <ul className="mt-3 grid gap-2 border-t border-dashed border-zinc-200 pt-3">
                    {group.older.map((entry) => (
                      <li key={entry.id} className="rounded-lg bg-zinc-50 px-3 py-2.5">
                        <div className="font-semibold text-wewin-navy">{entry.label}</div>
                        <time className="text-xs text-zinc-500" dateTime={entry.createdAt}>
                          {formatVnDateTime(entry.createdAt)}
                        </time>
                        {(entry.detail || entry.ip) && (
                          <p className="mt-0.5 break-words text-xs text-zinc-500">
                            {[entry.detail, entry.ip ? `IP ${entry.ip}` : null].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
