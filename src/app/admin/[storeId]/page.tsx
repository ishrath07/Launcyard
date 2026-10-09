import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { formatINR, formatWhen } from "@/lib/money";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell } from "@/components/admin-shell";

export default async function DashboardPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  const [orders, products, activities] = await Promise.all([
    prisma.order.findMany({ where: { storeId }, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { storeId }, orderBy: { stock: "asc" } }),
    prisma.activity.findMany({ where: { storeId }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const liveOrders = orders.filter((order) => order.status !== "cancelled");
  const revenue = liveOrders.reduce((sum, order) => sum + order.subtotalPaise, 0);
  const low = products.filter((product) => product.stock <= 5);
  if (!member.store) notFound();
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="">
        <h1 style={{ marginTop: 0 }}>Dashboard</h1>
        <p className="muted">Live address: /s/{member.store.slug}</p>
        <div className="grid-2">
          <article className="panel"><p className="kicker">Revenue</p><h2>{formatINR(revenue)}</h2><p className="muted">Excludes cancelled orders</p></article>
          <article className="panel"><p className="kicker">Orders</p><h2>{liveOrders.length}</h2><p className="muted">{orders.length} including cancelled</p></article>
          <article className="panel"><p className="kicker">Low stock</p><h2>{low.length}</h2><p className="muted">At or below 5 units</p></article>
          <article className="panel"><p className="kicker">Products</p><h2>{products.length}</h2></article>
        </div>
        <h2>Low stock</h2>
        {!low.length && <p className="muted">Nothing is at the alert level.</p>}
        {!!low.length && (
          <table>
            <tbody>
              {low.slice(0, 6).map((product) => (
                <tr key={product.id}><td>{product.name}</td><td>{product.stock} left</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <h2>Recent orders</h2>
        <table>
          <tbody>
            {orders.slice(0, 6).map((order) => (
              <tr key={order.id}><td>{order.number}</td><td>{order.customerName}</td><td>{order.status}</td><td>{formatINR(order.subtotalPaise)}</td></tr>
            ))}
          </tbody>
        </table>
        <h2>Activity</h2>
        {activities.map((activity) => <p key={activity.id}>{formatWhen(activity.createdAt)} — {activity.message}</p>)}
      </AdminShell>
    </>
  );
}
