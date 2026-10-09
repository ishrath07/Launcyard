import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";

export default async function StoresPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const memberships = await prisma.storeMember.findMany({
    where: { userId: user.id },
    include: { store: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PlatformHeader email={user.email} />
      <main className="wrap" style={{ paddingBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h1>Your stores</h1>
          <Link className="btn" href="/onboarding">New store</Link>
        </div>
        {!memberships.length && <p className="muted">You have not launched a store yet.</p>}
        <div className="grid-2">
          {memberships.map((membership) => (
            <article key={membership.id} className="panel">
              <p className="kicker">{membership.role}</p>
              <h2 style={{ margin: "0.2rem 0" }}>{membership.store.name}</h2>
              <p className="muted">/s/{membership.store.slug}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link className="btn" href={`/admin/${membership.storeId}`}>Admin</Link>
                <Link className="btn-ghost" href={`/s/${membership.store.slug}`}>View store</Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
