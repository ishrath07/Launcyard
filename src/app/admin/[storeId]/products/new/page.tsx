import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell } from "@/components/admin-shell";
import { ProductEditor } from "@/components/product-editor";

export default async function NewProductPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  const categories = await prisma.category.findMany({ where: { storeId }, orderBy: { name: "asc" } });
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="/products">
        <h1 style={{ marginTop: 0 }}>New product</h1>
        <ProductEditor storeId={storeId} categories={categories} />
      </AdminShell>
    </>
  );
}
