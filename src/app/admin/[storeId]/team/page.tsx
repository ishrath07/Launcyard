import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell, OwnerNote } from "@/components/admin-shell";
import { TeamDesk } from "@/components/team-desk";

export default async function TeamPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  const members = await prisma.storeMember.findMany({ where: { storeId }, include: { user: true } });
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="/team">
        <h1 style={{ marginTop: 0 }}>Team</h1>
        <p className="muted">Every query in the admin is limited to this store. Another owner cannot open this desk.</p>
        {member.role !== "OWNER" ? <OwnerNote /> : (
          <TeamDesk storeId={storeId} members={members.map((item) => ({ userId: item.userId, email: item.user.email, name: item.user.name, role: item.role }))} />
        )}
      </AdminShell>
    </>
  );
}
