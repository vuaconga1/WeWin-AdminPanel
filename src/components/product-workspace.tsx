"use client";

import { useEffect, useState } from "react";
import { ClipboardList, ExternalLink, Globe } from "lucide-react";
import { getMessages, t } from "@/i18n/get-messages";
import type { ProductId } from "@/lib/products";

type WorkspaceTab = "history" | "main";

type Props = {
  productId: ProductId;
  productName: string;
  /** Null when product public origin is not configured. */
  publicSiteUrl: string | null;
  locale?: "vi" | "en";
  children: React.ReactNode;
};

export function ProductWorkspace({
  productId,
  productName,
  publicSiteUrl,
  locale = "vi",
  children,
}: Props) {
  const m = getMessages(locale);
  const historyLabel = t(m, "tabHistory");
  const mainLabel = t(m, "tabMainSite");
  const [tab, setTab] = useState<WorkspaceTab>("history");
  const [iframeReady, setIframeReady] = useState(false);

  const embedSrc = `/api/sso/embed?product=${encodeURIComponent(productId)}&embed=1`;
  const openTabHref = `/api/sso/embed?product=${encodeURIComponent(productId)}&embed=0`;

  useEffect(() => {
    if (tab === "main") setIframeReady(true);
  }, [tab]);

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={`${productName} workspace`}
        className="inline-flex flex-wrap gap-1 rounded-full border border-wewin-border bg-white p-1 shadow-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          onClick={() => setTab("history")}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
            tab === "history"
              ? "bg-wewin-navy text-white"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
          }`}
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
          {historyLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "main"}
          onClick={() => setTab("main")}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
            tab === "main"
              ? "bg-wewin-navy text-white"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
          }`}
        >
          <Globe className="h-4 w-4" aria-hidden />
          {mainLabel}
        </button>
      </div>

      {tab === "history" ? (
        <div role="tabpanel">{children}</div>
      ) : (
        <div role="tabpanel" className="space-y-3">
          {!publicSiteUrl ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-950">
              Chưa cấu hình URL trang chính cho <strong>{productName}</strong>.
              Thêm biến môi trường tương ứng (ví dụ{" "}
              <code className="rounded bg-white/80 px-1">*_PUBLIC_SITE_URL</code>
              ).
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <a
                  href={openTabHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-wewin-navy hover:underline"
                >
                  Mở tab mới
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>

              <div className="overflow-hidden rounded-2xl border border-wewin-border bg-white shadow-sm">
                {iframeReady ? (
                  <iframe
                    title={`${productName} — khu vực admin`}
                    src={embedSrc}
                    className="h-[calc(100vh-14rem)] min-h-[480px] w-full bg-white"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="clipboard-read; clipboard-write; fullscreen"
                  />
                ) : null}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
