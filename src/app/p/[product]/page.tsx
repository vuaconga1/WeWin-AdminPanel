import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { PlacementPanel } from "@/components/placement-panel";
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
