import { requireMember } from "@/lib/guard";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell, OwnerNote } from "@/components/admin-shell";
import { ContentForm } from "@/components/content-form";
import { prisma } from "@/lib/db";

export default async function ContentPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  const sections = await prisma.homepageSection.findMany({ where: { storeId }, orderBy: { sort: "asc" } });
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="/content">
        <h1 style={{ marginTop: 0 }}>Content</h1>
        {member.role !== "OWNER" ? <OwnerNote /> : <ContentForm storeId={storeId} store={member.store} sections={sections} />}
      </AdminShell>
    </>
  );
}
