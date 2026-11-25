import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { prisma } from "@/lib/db";
import { getProduct, listProducts } from "@/lib/products";
import { requireAdminPage } from "@/lib/require-admin-page";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ product: string; id: string }>;
};

export default async function PlacementDetailPage({ params }: Props) {
  const { product: productId, id } = await params;
  const product = getProduct(productId);
  if (!product) notFound();

  const user = await requireAdminPage(`${product.href}/${id}`);
  const row = await prisma.placementAttempt.findFirst({
    where: { id, source: product.id },
    select: {
      id: true,
      externalId: true,
      studentName: true,
      branch: true,
      testLabel: true,
      testSlug: true,
      finishedAt: true,
      scoreCorrect: true,
      scoreTotal: true,
      scorePercent: true,
      source: true,
    },
  });
  if (!row) notFound();

  const when = row.finishedAt.toLocaleString("vi-VN", {
    timeZone: "Asia/Bangkok",
  });

  return (
    <AdminShell user={user} products={listProducts()} active={product.id}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={product.href}
            className="text-sm font-semibold text-wewin-accent-blue hover:underline"
          >
            ← {product.nameVi}
          </Link>
        </div>

        <section className="rounded-2xl border border-wewin-border bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wewin-gold">
            {product.nameVi} · chi tiết
          </p>
          <h1 className="mt-2 text-2xl font-bold text-wewin-navy">
            {row.studentName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">#{row.externalId}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-zinc-400">
                Cơ sở
              </dt>
              <dd className="mt-1 font-medium text-zinc-900">{row.branch}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-zinc-400">
                Bài kiểm tra
              </dt>
              <dd className="mt-1 font-medium text-zinc-900">{row.testLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-zinc-400">
                Ngày giờ nộp
              </dt>
              <dd className="mt-1 font-medium text-zinc-900">{when}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-zinc-400">
                Kết quả
              </dt>
              <dd className="mt-1 font-medium text-zinc-900">
                {row.scoreCorrect != null && row.scoreTotal != null
                  ? `${row.scoreCorrect}/${row.scoreTotal}`
                  : "—"}
                {row.scorePercent != null
                  ? ` (${Math.round(row.scorePercent)}%)`
                  : ""}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </AdminShell>
  );
}
