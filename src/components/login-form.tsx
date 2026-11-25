"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = useMemo(() => {
    const raw = search.get("next")?.trim() || "/";
    return raw.startsWith("/") ? raw : "/";
  }, [search]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    const code = search.get("error");
    if (code === "ADMIN_REQUIRED") {
      return "Tài khoản này không có quyền admin.";
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [ssoBusy, setSsoBusy] = useState(false);
  const [ssoAvailable, setSsoAvailable] = useState<boolean | null>(null);
  const [showLocal, setShowLocal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as {
          user?: { role?: string } | null;
          ssoConfigured?: boolean;
        } | null;
        if (cancelled) return;
        if (body?.user?.role === "ADMIN") {
          router.replace(nextPath);
          return;
        }
        setSsoAvailable(Boolean(body?.ssoConfigured));
        if (!body?.ssoConfigured) setShowLocal(true);
      } catch {
        if (!cancelled) {
          setSsoAvailable(false);
          setShowLocal(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  function startSso() {
    setSsoBusy(true);
    setError(null);
    window.location.assign(
      `/api/sso/login?next=${encodeURIComponent(nextPath)}`,
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok) {
        setError(data.code || data.error || "LOGIN_FAILED");
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("FETCH_FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-wewin-border bg-wewin-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wewin-gold">
        WeWIN
      </p>
      <h1 className="mt-2 text-2xl font-bold text-wewin-navy">WeWIN Admin</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Một tài khoản WeWIN — đăng nhập một lần, dùng chung session trên các web
        trong hệ thống.
      </p>

      {ssoAvailable ? (
        <button
          type="button"
          onClick={startSso}
          disabled={ssoBusy}
          className="mt-6 w-full rounded-lg bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
        >
          {ssoBusy
            ? "Đang chuyển tới WeWIN IELTS…"
            : "Đăng nhập với WeWIN (IELTS)"}
        </button>
      ) : null}

      {ssoAvailable === null ? (
        <p className="mt-6 text-center text-sm text-zinc-500">Đang tải…</p>
      ) : null}

      {ssoAvailable ? (
        <button
          type="button"
          onClick={() => setShowLocal((v) => !v)}
          className="mt-3 w-full text-center text-xs font-medium text-zinc-500 hover:text-zinc-800"
        >
          {showLocal
            ? "Ẩn đăng nhập local"
            : "Đăng nhập local (dev / dự phòng)"}
        </button>
      ) : null}

      {showLocal ? (
        <form
          noValidate
          onSubmit={onSubmit}
          className="mt-4 border-t border-wewin-border pt-4"
        >
          <p className="mb-3 text-xs text-zinc-500">
            Tài khoản trong database AdminPanel (không đồng bộ user IELTS).
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-500">Email / username</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-wewin-border px-3 py-2 outline-none focus:ring-2 focus:ring-wewin-accent-blue/30"
              autoComplete="username"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-zinc-500">Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-wewin-border px-3 py-2 outline-none focus:ring-2 focus:ring-wewin-accent-blue/30"
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg border border-wewin-navy bg-white px-4 py-2.5 text-sm font-semibold text-wewin-navy hover:bg-zinc-50 disabled:opacity-60"
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập local"}
          </button>
        </form>
      ) : null}

      {!showLocal && error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
