import { requireMember } from "@/lib/guard";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell, OwnerNote } from "@/components/admin-shell";
import { ThemeDesk } from "@/components/theme-desk";

export default async function ThemePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="/theme">
        <h1 style={{ marginTop: 0 }}>Theme</h1>
        {member.role !== "OWNER" ? <OwnerNote /> : (
          <ThemeDesk storeId={storeId} initial={member.store.themeId} storeName={member.store.name} city={member.store.city} />
        )}
      </AdminShell>
    </>
  );
}
