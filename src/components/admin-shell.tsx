"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Globe,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { SessionUser } from "@/lib/session";
import type { ProductId, ProductLink } from "@/lib/products";
import { getMessages, t } from "@/i18n/get-messages";

type ActiveNav = "home" | ProductId;

type Props = {
  user: SessionUser;
  products: ProductLink[];
  active: ActiveNav;
  children: React.ReactNode;
  locale?: "vi" | "en";
};

const SIDEBAR_COLLAPSED_KEY = "wewin_admin_sidebar_collapsed";

function navItemClass(active: boolean, compact: boolean) {
  if (compact) {
    return `mx-1 flex items-center justify-center rounded-full p-2.5 text-sm font-medium transition ${
      active
        ? "wewin-nav-active text-white"
        : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
    }`;
  }
  return `mx-1 flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition ${
    active
      ? "wewin-nav-active text-white"
      : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
  }`;
}

export function AdminShell({
  user,
  products,
  active,
  children,
  locale = "vi",
}: Props) {
  const m = getMessages(locale);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "1" || stored === "true") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const displayName = user.fullName || user.username;
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "A";

  function SidebarBody({ compact }: { compact: boolean }) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-b border-wewin-border/70 pb-4 px-1">
          <div
            className={`flex items-center gap-3 ${compact ? "justify-center" : ""}`}
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wewin-navy text-sm font-bold text-white">
              {initials}
            </div>
            {!compact ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-wewin-navy">
                  {displayName}
                </p>
                <span className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                  Admin
                </span>
              </div>
            ) : null}
          </div>
          {!compact ? (
            <div className="mt-3 rounded-xl border border-wewin-border/80 bg-white/70 px-3 py-2 text-xs text-zinc-600">
              {t(m, "accountStatus")}
            </div>
          ) : null}
        </div>

        <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pb-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={navItemClass(active === "home", compact)}
            title={t(m, "navHome")}
          >
            <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
            {!compact ? <span>{t(m, "navHome")}</span> : null}
          </Link>

          <p
            className={`mx-3 mt-4 mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 ${
              compact ? "sr-only" : ""
            }`}
          >
            {t(m, "navAdminProducts")}
          </p>

          {products.map((p) => {
            const label = locale === "en" ? p.nameEn : p.nameVi;
            return (
              <Link
                key={p.id}
                href={p.href}
                onClick={() => setOpen(false)}
                title={label}
                className={navItemClass(active === p.id, compact)}
              >
                <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                {!compact ? (
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="wewin-site-header sticky top-0 z-40 border-b border-white/10 bg-wewin-navy text-white">
        <div className="flex h-full items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg text-white/90 hover:bg-white/10 lg:hidden"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-wewin-gold">
              WeWIN Education
            </p>
            <p className="truncate text-sm font-semibold text-white/90">
              {t(m, "brand")}
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 sm:inline-flex">
            <Globe className="h-3.5 w-3.5 text-wewin-gold" aria-hidden />
            WeWIN Admin
          </div>

          <span className="hidden text-xs font-semibold text-white/70 sm:inline">
            VI
          </span>

          <form action="/api/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t(m, "logout")}</span>
            </button>
          </form>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside
          className="wewin-sidebar-rail wewin-sidebar-surface sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col lg:flex"
          data-collapsed={collapsed ? "true" : "false"}
        >
          <div className="flex min-h-0 flex-1 flex-col p-3">
            <SidebarBody compact={collapsed} />
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="m-2 flex items-center justify-center gap-2 rounded-lg border border-wewin-border/80 bg-white/60 px-2 py-2 text-xs font-medium text-zinc-600 hover:bg-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>{t(m, "collapseSidebar")}</span>
              </>
            )}
          </button>
        </aside>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-wewin-navy/40"
              aria-label="Close"
              onClick={() => setOpen(false)}
            />
            <aside className="wewin-sidebar-surface absolute inset-y-0 left-0 flex w-[min(100%,280px)] flex-col shadow-xl">
              <div className="flex items-center justify-between border-b border-wewin-border px-3 py-3">
                <p className="text-sm font-bold text-wewin-navy">Menu</p>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/70"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <SidebarBody compact={false} />
              </div>
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
