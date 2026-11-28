import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ExamPanel } from "@/components/exam-panel";
import { PlacementPanel } from "@/components/placement-panel";
import { ProductWorkspace } from "@/components/product-workspace";
import { ToeicPanel } from "@/components/toeic-panel";
import { VstepPanel } from "@/components/vstep-panel";
import {
  getProduct,
  getProductPublicSiteUrl,
  listProducts,
} from "@/lib/products";
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
  const publicSiteUrl = getProductPublicSiteUrl(product.id);

  let history: React.ReactNode;
  if (product.id === "exam") {
    history = (
      <ExamPanel title="Lịch sử luyện thi · Exam" lead={product.descriptionVi} />
    );
  } else if (product.id === "toeic") {
    history = (
      <ToeicPanel title="Lịch sử làm bài · TOEIC" lead={product.descriptionVi} />
    );
  } else if (product.id === "vstep") {
    history = (
      <VstepPanel title="Lịch sử làm bài · VSTEP" lead={product.descriptionVi} />
    );
  } else {
    history = (
      <PlacementPanel
        source={product.id}
        title={`Kết quả Placement · ${product.nameVi}`}
        lead={product.descriptionVi}
      />
    );
  }

  return (
    <AdminShell user={user} products={products} active={product.id}>
      <ProductWorkspace
        productId={product.id}
        productName={product.nameVi}
        publicSiteUrl={publicSiteUrl}
      >
        {history}
      </ProductWorkspace>
    </AdminShell>
  );
}
