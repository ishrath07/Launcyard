import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell, OwnerNote } from "@/components/admin-shell";
import { AssistantDesk } from "@/components/assistant-desk";

export default async function AssistantPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  const turns = member.role === "OWNER"
    ? await prisma.chatTurn.findMany({ where: { storeId }, orderBy: { createdAt: "asc" }, take: 20 })
    : [];
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="/assistant">
        <h1 style={{ marginTop: 0 }}>Store assistant</h1>
        {member.role !== "OWNER" ? <OwnerNote /> : (
          <AssistantDesk
            storeId={storeId}
            history={turns.map((turn) => {
              const evidence = JSON.parse(turn.evidenceJson) as { source?: string; rows?: Record<string, string | number>[] };
              return { question: turn.question, answer: turn.answer, source: evidence.source ?? "", evidence: evidence.rows ?? [] };
            })}
          />
        )}
      </AdminShell>
    </>
  );
}
