"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Eye, MessageSquare, X } from "lucide-react";
import type {
  FastbotsChatDetail,
  FastbotsChatListResult,
} from "@/lib/fastbots/types";

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

function statusBadgeClass(status: string): string {
  if (status === "OPEN") return "bg-emerald-50 text-emerald-800";
  if (status === "CLOSED") return "bg-zinc-100 text-zinc-600";
  return "bg-amber-50 text-amber-900";
}

function statusLabel(status: string): string {
  if (status === "OPEN") return "Đang mở";
  if (status === "CLOSED") return "Đã đóng";
  return "Chưa rõ";
}

function channelLabel(channel: string | null | undefined): string {
  if (!channel) return "—";
  const key = channel.trim().toUpperCase();
  if (key === "MESSENGER") return "Messenger";
  if (key === "FACEBOOK_COMMENT") return "Comment fanpage";
  if (key === "WEB") return "Website";
  return channel;
}

function roleLabel(role: string): string {
  if (role === "visitor") return "Khách";
  if (role === "bot") return "Bot";
  if (role === "agent") return "Agent";
  return role;
}

type StatusFilter = "ALL" | "OPEN" | "CLOSED" | "UNKNOWN";
type ChannelFilter = "ALL" | "MESSENGER" | "FACEBOOK_COMMENT" | "WEB";

type Props = {
  hideHero?: boolean;
};

export function FastbotsChats({ hideHero = false }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [channel, setChannel] = useState<ChannelFilter>("ALL");
  const [data, setData] = useState<FastbotsChatListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<FastbotsChatDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncingMessenger, setSyncingMessenger] = useState(false);
  const [syncingComments, setSyncingComments] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (status !== "ALL") params.set("status", status);
      if (channel !== "ALL") params.set("channel", channel);
      params.set("take", "50");
      const res = await fetch(
        `/api/admin/hub/fastbots-chats?${params.toString()}`,
        { cache: "no-store" },
      );
      const body = (await res.json().catch(() => null)) as
        | FastbotsChatListResult
        | { code?: string; error?: string }
        | null;
      if (!res.ok) {
        setError(
          (body as { code?: string } | null)?.code ||
            (body as { error?: string } | null)?.error ||
            "LOAD_FAILED",
        );
        setData(null);
        return;
      }
      setData(body as FastbotsChatListResult);
    } catch {
      setError("FETCH_FAILED");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query, status, channel]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, query ? 300 : 0);
    return () => window.clearTimeout(handle);
  }, [load, query]);

  const openDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/hub/fastbots-chats/${id}`, {
        cache: "no-store",
      });
      const body = (await res.json().catch(() => null)) as
        | FastbotsChatDetail
        | { code?: string }
        | null;
      if (!res.ok) {
        setError((body as { code?: string } | null)?.code || "DETAIL_FAILED");
        return;
      }
      setDetail(body as FastbotsChatDetail);
    } catch {
      setError("DETAIL_FAILED");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const syncMessenger = useCallback(async () => {
    setSyncingMessenger(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/hub/messenger-sync", {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as {
        code?: string;
      } | null;
      if (!res.ok) {
        setError(body?.code || "MESSENGER_SYNC_FAILED");
        return;
      }
      await load();
    } catch {
      setError("MESSENGER_SYNC_FAILED");
    } finally {
      setSyncingMessenger(false);
    }
  }, [load]);

  const syncComments = useCallback(async () => {
    setSyncingComments(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/hub/facebook-comments-sync", {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as {
        code?: string;
        detail?: string;
      } | null;
      if (!res.ok) {
        setError(body?.code || body?.detail || "COMMENTS_SYNC_FAILED");
        return;
      }
      await load();
    } catch {
      setError("COMMENTS_SYNC_FAILED");
    } finally {
      setSyncingComments(false);
    }
  }, [load]);

  const dashboardUrl = data?.config.dashboardUrl || "https://app.fastbots.ai/";
  const webhookConfigured = data?.config.webhookConfigured ?? false;
  const messengerConfigured = data?.config.messengerConfigured ?? false;
  const facebookSyncBusy = syncingMessenger || syncingComments;

  return (
    <div className="space-y-5">
      {!hideHero ? (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-wewin-navy via-[#142852] to-wewin-navy-hover px-5 py-6 text-white sm:px-7 sm:py-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wewin-gold-soft">
            WeWIN · NTL & XVNT
          </p>
          <h1 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
            Chat History · Fastbots
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            Xem hội thoại chatbot tư vấn (đồng bộ webhook). Chi tiết đầy đủ vẫn
            trên Fastbots.
          </p>
          <MessageSquare
            className="pointer-events-none absolute right-8 top-1/2 hidden h-16 w-16 -translate-y-1/2 text-wewin-gold/40 sm:block"
            aria-hidden
          />
        </section>
      ) : null}

      <section className="relative min-w-0 rounded-xl border border-wewin-border bg-white shadow-sm">
        <header className="border-b border-wewin-border px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-zinc-900">
                Chat History (Fastbots)
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Hội thoại đồng bộ khi Fastbots tạo/cập nhật contact. Thời gian
                UTC+7.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={facebookSyncBusy || !messengerConfigured}
                onClick={() => void syncMessenger()}
                title={
                  messengerConfigured
                    ? undefined
                    : "Chưa cấu hình FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN"
                }
                className="inline-flex min-h-10 items-center rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm font-semibold text-wewin-navy hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {syncingMessenger
                  ? "Đang đồng bộ Messenger…"
                  : "Đồng bộ Messenger"}
              </button>
              <button
                type="button"
                disabled={facebookSyncBusy || !messengerConfigured}
                onClick={() => void syncComments()}
                title={
                  messengerConfigured
                    ? undefined
                    : "Chưa cấu hình FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN"
                }
                className="inline-flex min-h-10 items-center rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm font-semibold text-wewin-navy hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {syncingComments ? "Đang đồng bộ comment…" : "Đồng bộ Comment"}
              </button>
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-wewin-border bg-white px-3 py-2 text-sm font-semibold text-wewin-navy hover:bg-zinc-50"
              >
                Mở Fastbots
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </div>
        </header>

        {!webhookConfigured && data ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950 sm:px-5">
            <p className="font-semibold">
              Chưa cấu hình webhook Fastbots trên server.
            </p>
            <p className="mt-1 break-words text-amber-900/90">
              Thêm FASTBOTS_WEBHOOK_SECRET (≥16 ký tự) vào env, rồi trong
              Fastbots đặt Endpoint URL: {data.config.webhookPath}
              ?secret=&lt;secret&gt;.
            </p>
          </div>
        ) : null}

        <div className="border-b border-sky-100 bg-sky-50/70 px-4 py-2.5 text-xs text-sky-950 sm:px-5">
          Widget website đồng bộ từng tin. Messenger / Comment fanpage: dùng
          nút Đồng bộ (cần FACEBOOK_PAGE_ID + TOKEN).
        </div>

        {!messengerConfigured && data ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950 sm:px-5">
            <p className="font-semibold">
              Chưa cấu hình FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN trên
              server.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="px-4 pt-3 sm:px-5">
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 border-b border-wewin-border px-4 py-3 sm:px-5">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên, email hoặc tin nhắn cuối"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue/20"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPEN">Đang mở</option>
            <option value="CLOSED">Đã đóng</option>
            <option value="UNKNOWN">Chưa rõ</option>
          </select>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as ChannelFilter)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">Tất cả kênh</option>
            <option value="MESSENGER">Messenger</option>
            <option value="FACEBOOK_COMMENT">Comment fanpage</option>
            <option value="WEB">Website</option>
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
                <th className="px-4 py-2.5">Liên hệ</th>
                <th className="px-3 py-2.5">Kênh</th>
                <th className="px-3 py-2.5">Tin nhắn cuối</th>
                <th className="px-3 py-2.5">Bắt đầu</th>
                <th className="px-3 py-2.5">Trạng thái</th>
                <th className="px-4 py-2.5 text-right">Thao tác</th>
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
                    <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-lg bg-wewin-accent-blue-bg text-wewin-navy">
                      <MessageSquare className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="mt-2 block">
                      Chưa có hội thoại. Webhook Fastbots hoặc seed sẽ hiện ở
                      đây.
                    </span>
                  </td>
                </tr>
              ) : (
                data.items.map((row) => {
                  const { date, time } = formatVnDateTime(row.startedAt);
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-zinc-100 hover:bg-zinc-50/80"
                    >
                      <td className="px-4 py-2.5">
                        <div className="min-w-0">
                          <strong className="block truncate text-zinc-900">
                            {row.contactName}
                          </strong>
                          {row.contactEmail ? (
                            <span className="block truncate text-xs text-zinc-500">
                              {row.contactEmail}
                            </span>
                          ) : row.contactPhone ? (
                            <span className="block truncate text-xs text-zinc-500">
                              {row.contactPhone}
                            </span>
                          ) : (
                            <span className="block truncate text-xs text-zinc-400">
                              {row.externalId}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-700">
                        <span className="inline-block rounded-full bg-wewin-accent-blue-bg px-2 py-0.5 text-[11px] font-semibold text-wewin-navy">
                          {channelLabel(row.channel)}
                        </span>
                      </td>
                      <td className="max-w-[240px] px-3 py-2.5">
                        <span className="line-clamp-2 break-words text-zinc-800">
                          {row.lastMessage || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {date}
                        {time ? (
                          <span className="block text-xs text-zinc-500">
                            {time}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(row.status)}`}
                        >
                          {statusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => void openDetail(row.id)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-wewin-navy hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Xem
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 ? (
          <footer className="border-t border-wewin-border px-4 py-3 text-xs text-zinc-500 sm:px-5">
            Hiển thị {data.items.length} / {data.total} hội thoại
          </footer>
        ) : null}

        {detailLoading || detail ? (
          <div
            className="fixed inset-0 z-40 flex justify-end bg-black/30 p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              aria-label="Đóng"
              onClick={() => setDetail(null)}
            />
            <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-xl sm:rounded-xl">
              <header className="flex items-start justify-between gap-3 border-b border-wewin-border px-4 py-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-zinc-900">
                    {detail?.contactName || "Đang tải…"}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {[
                      detail?.channel
                        ? channelLabel(detail.channel)
                        : null,
                      detail?.contactEmail,
                      detail?.contactPhone,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </header>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {detail?.channel === "FACEBOOK_COMMENT" &&
                detail.postContext &&
                (detail.postContext.postSnippet ||
                  detail.postContext.permalink) ? (
                  <div className="rounded-lg border border-wewin-border bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                    <p className="font-semibold text-wewin-navy">Bài đăng</p>
                    {detail.postContext.postSnippet ? (
                      <p className="mt-1 line-clamp-3 break-words">
                        {detail.postContext.postSnippet}
                      </p>
                    ) : null}
                    {detail.postContext.permalink ? (
                      <a
                        href={detail.postContext.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 font-semibold text-wewin-accent-blue hover:underline"
                      >
                        Mở trên Facebook
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {detailLoading && !detail ? (
                  <p className="text-sm text-zinc-500">Đang tải…</p>
                ) : !detail?.messages.length ? (
                  <p className="text-sm text-zinc-500">
                    Chưa có tin nhắn trong payload.
                  </p>
                ) : (
                  detail.messages.map((m, idx) => {
                    const mine = m.role === "visitor";
                    const when = formatVnDateTime(m.createdAt);
                    return (
                      <div
                        key={`${idx}-${m.createdAt || ""}`}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            mine
                              ? "bg-wewin-navy text-white"
                              : "bg-zinc-100 text-zinc-900"
                          }`}
                        >
                          <p className="text-[10px] font-semibold opacity-70">
                            {roleLabel(m.role)}
                            {m.channel ? ` · ${m.channel}` : ""}
                          </p>
                          <p className="mt-0.5 break-words whitespace-pre-wrap">
                            {m.text}
                          </p>
                          <p className="mt-1 text-[10px] opacity-60">
                            {when.date} {when.time}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
