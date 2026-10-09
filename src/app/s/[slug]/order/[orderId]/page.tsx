import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatINR, formatWhen } from "@/lib/money";

export default async function OrderPage({ params }: { params: Promise<{ slug: string; orderId: string }> }) {
  const { slug, orderId } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: store.id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  return (
    <div>
      <h1>Order {order.number}</h1>
      <p>Status: {order.status}</p>
      <p>{order.customerName} · {order.email}</p>
      <p>{order.address}</p>
      <table>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}><td>{item.name}</td><td>{item.qty}</td><td>{formatINR(item.pricePaise * item.qty)}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="price">Total {formatINR(order.subtotalPaise)}</p>
      <h2>Updates</h2>
      {order.events.map((event) => (
        <p key={event.id}><strong>{formatWhen(event.createdAt)}</strong> — {event.message}</p>
      ))}
    </div>
  );
}
