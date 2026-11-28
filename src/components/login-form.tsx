"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  ADMIN_REQUIRED: "Tài khoản này không có quyền admin.",
  INVALID_CREDENTIALS: "Email/username hoặc mật khẩu không đúng.",
  INVALID_EMAIL: "Email không hợp lệ.",
  EMAIL_TYPO_GMAIL: "Email có vẻ sai (gợi ý: gmail.com).",
  INVALID_USERNAME: "Username không hợp lệ.",
  INVALID_INPUT: "Thông tin đăng nhập không hợp lệ.",
  FETCH_FAILED: "Không kết nối được máy chủ. Thử lại.",
  LOGIN_FAILED: "Đăng nhập thất bại.",
};

function messageForCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return ERROR_MESSAGES[code] || code;
}

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = useMemo(() => {
    const raw = search.get("next")?.trim() || "/";
    return raw.startsWith("/") ? raw : "/";
  }, [search]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() =>
    messageForCode(search.get("error")),
  );
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as {
          user?: { role?: string } | null;
        } | null;
        if (cancelled) return;
        if (body?.user?.role === "ADMIN") {
          router.replace(nextPath);
          return;
        }
      } catch {
        // stay on form
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

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
        setError(
          messageForCode(data.code || data.error) ||
            ERROR_MESSAGES.LOGIN_FAILED,
        );
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError(ERROR_MESSAGES.FETCH_FAILED);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="rounded-2xl border border-wewin-border bg-wewin-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Đang tải…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-wewin-border bg-wewin-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wewin-gold">
        WeWIN
      </p>
      <h1 className="mt-2 text-2xl font-bold text-wewin-navy">WeWIN Admin</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Đăng nhập tại đây — session cookie dùng chung cho các web trong hệ
        thống WeWIN.
      </p>

      <form noValidate onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-500">Email / username</span>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            className="w-full rounded-lg border border-wewin-border px-3 py-2 outline-none focus:ring-2 focus:ring-wewin-accent-blue/30"
            autoComplete="username"
            autoFocus
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-500">Mật khẩu</span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            className="w-full rounded-lg border border-wewin-border px-3 py-2 outline-none focus:ring-2 focus:ring-wewin-accent-blue/30"
            autoComplete="current-password"
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
