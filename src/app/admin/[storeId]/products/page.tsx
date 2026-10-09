import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell } from "@/components/admin-shell";
import { ProductTable } from "@/components/product-table";

export default async function ProductsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  const products = await prisma.product.findMany({
    where: { storeId },
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="/products">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <h1 style={{ marginTop: 0 }}>Products</h1>
          <Link className="btn" href={`/admin/${storeId}/products/new`}>Add product</Link>
        </div>
        <ProductTable
          storeId={storeId}
          role={member.role}
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            stock: product.stock,
            pricePaise: product.pricePaise,
            discountPercent: product.discountPercent,
            active: product.active,
            category: product.category?.name ?? "—",
          }))}
        />
      </AdminShell>
    </>
  );
}
