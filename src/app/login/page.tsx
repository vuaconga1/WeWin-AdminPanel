import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <Suspense
        fallback={
          <div className="rounded-2xl border border-wewin-border bg-wewin-white p-8 text-center text-sm text-zinc-500 shadow-sm">
            Đang tải…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
