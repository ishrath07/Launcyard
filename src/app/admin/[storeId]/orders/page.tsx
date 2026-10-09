import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { formatINR, formatWhen } from "@/lib/money";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell } from "@/components/admin-shell";

export default async function OrdersPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  const orders = await prisma.order.findMany({ where: { storeId }, orderBy: { createdAt: "desc" }, include: { items: true } });
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="/orders">
        <h1 style={{ marginTop: 0 }}>Orders</h1>
        <table>
          <thead><tr><th>Order</th><th>When</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/admin/${storeId}/orders/${order.id}`}>{order.number}</Link></td>
                <td>{formatWhen(order.createdAt)}</td>
                <td>{order.customerName}</td>
                <td>{order.status}</td>
                <td>{formatINR(order.subtotalPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="muted">No orders yet. A shopper checkout will show up here.</p>}
      </AdminShell>
    </>
  );
}
