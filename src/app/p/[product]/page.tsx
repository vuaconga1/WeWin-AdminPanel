import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ExamPanel } from "@/components/exam-panel";
import { PlacementPanel } from "@/components/placement-panel";
import { ToeicPanel } from "@/components/toeic-panel";
import { VstepPanel } from "@/components/vstep-panel";
import { getProduct, listProducts } from "@/lib/products";
import { requireAdminPage } from "@/lib/require-admin-page";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ product: string }>;
};

export default async function ProductAdminPage({ params }: Props) {
  const { product: productId } = await params;
  const product = getProduct(productId);
  if (!product) notFound();

  const user = await requireAdminPage(product.href);
  const products = listProducts();

  if (product.id === "exam") {
    return (
      <AdminShell user={user} products={products} active={product.id}>
        <ExamPanel title="Lịch sử luyện thi · Exam" lead={product.descriptionVi} />
      </AdminShell>
    );
  }

  if (product.id === "toeic") {
    return (
      <AdminShell user={user} products={products} active={product.id}>
        <ToeicPanel title="Lịch sử làm bài · TOEIC" lead={product.descriptionVi} />
      </AdminShell>
    );
  }

  if (product.id === "vstep") {
    return (
      <AdminShell user={user} products={products} active={product.id}>
        <VstepPanel title="Lịch sử làm bài · VSTEP" lead={product.descriptionVi} />
      </AdminShell>
    );
  }

  const titleVi = `Kết quả Placement · ${product.nameVi}`;
  const leadVi = product.descriptionVi;

  return (
    <AdminShell user={user} products={products} active={product.id}>
      <PlacementPanel
        source={product.id}
        title={titleVi}
        lead={leadVi}
      />
    </AdminShell>
  );
}
