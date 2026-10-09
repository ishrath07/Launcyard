import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { formatINR, formatWhen } from "@/lib/money";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { AdminShell } from "@/components/admin-shell";
import { OrderStatusForm } from "@/components/order-status";

export default async function OrderDetailPage({ params }: { params: Promise<{ storeId: string; orderId: string }> }) {
  const { storeId, orderId } = await params;
  const member = await requireMember(storeId);
  const user = await currentUser();
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  return (
    <>
      <PlatformHeader email={user?.email} />
      <AdminShell storeId={storeId} storeName={member.store.name} slug={member.store.slug} role={member.role} current="/orders">
        <h1 style={{ marginTop: 0 }}>Order {order.number}</h1>
        <p>{order.customerName} · {order.email} · {order.phone}</p>
        <p>{order.address}</p>
        <p>Customer page: <Link href={`/s/${member.store.slug}/order/${order.id}`}>/s/{member.store.slug}/order/{order.id}</Link></p>
        <OrderStatusForm storeId={storeId} orderId={order.id} status={order.status} />
        <table>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}><td>{item.name}</td><td>{item.qty}</td><td>{formatINR(item.pricePaise * item.qty)}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="price">Total {formatINR(order.subtotalPaise)}</p>
        <h2>Status emails</h2>
        <p className="muted">There is no mail server in this local app. Each update is saved as the email that would go to the customer.</p>
        {order.events.map((event) => (
          <article key={event.id} className="panel" style={{ marginBottom: 8 }}>
            <strong>{formatWhen(event.createdAt)} · {event.status} · to {event.sentTo}</strong>
            <p>{event.message}</p>
          </article>
        ))}
      </AdminShell>
    </>
  );
}
