import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell } from "@/components/admin-shell";
import { ProductEditor } from "@/components/product-editor";

export default async function EditProductPage({ params }: { params: Promise<{ storeId: string; productId: string }> }) {
  const { storeId, productId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  const [product, categories] = await Promise.all([
    prisma.product.findFirst({ where: { id: productId, storeId }, include: { variants: true } }),
    prisma.category.findMany({ where: { storeId }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="/products">
        <h1 style={{ marginTop: 0 }}>Edit product</h1>
        <ProductEditor storeId={storeId} categories={categories} product={product} />
      </AdminShell>
    </>
  );
}
