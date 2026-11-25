import { AdminShell } from "@/components/admin-shell";
import { HubHome } from "@/components/hub-home";
import { listProducts } from "@/lib/products";
import { requireAdminPage } from "@/lib/require-admin-page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireAdminPage("/");
  const products = listProducts();
  return (
    <AdminShell user={user} products={products} active="home">
      <HubHome />
    </AdminShell>
  );
}
