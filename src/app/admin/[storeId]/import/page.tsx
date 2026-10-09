import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell } from "@/components/admin-shell";
import { ImportDesk } from "@/components/import-desk";

export default async function ImportPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  const categories = await prisma.category.findMany({ where: { storeId } });
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="/import">
        <h1 style={{ marginTop: 0 }}>Import products</h1>
        <ImportDesk storeId={storeId} categories={categories.map((category) => category.name)} />
      </AdminShell>
    </>
  );
}
