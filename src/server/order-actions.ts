"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { sellingPaise } from "@/lib/money";

const STATUSES = ["placed", "packed", "shipped", "delivered", "cancelled"] as const;

function statusCopy(storeName: string, number: string, status: string) {
  const line: Record<string, string> = {
    placed: "We've received your order and will pack it soon.",
    packed: "Your order is packed and waiting to be handed over.",
    shipped: "Your order is on the way.",
    delivered: "Your order was delivered.",
    cancelled: "Your order was cancelled. Any reserved stock has been returned.",
  };
  return `${storeName}: order ${number} is now ${status}. ${line[status] ?? ""}`.trim();
}

export async function placeOrder(input: {
  slug: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: { productId: string; variantId?: string; qty: number }[];
}) {
  const store = await prisma.store.findUnique({ where: { slug: input.slug } });
  if (!store || !store.published) return { error: "This store is not available." };
  if (!input.items.length) return { error: "Your cart is empty." };
  if (input.customerName.trim().length < 2) return { error: "Enter the customer name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return { error: "Enter an email for the receipt." };
  if (input.phone.trim().length < 8) return { error: "Enter a phone number." };
  if (input.address.trim().length < 8) return { error: "Enter a delivery address." };

  try {
    const order = await prisma.$transaction(async (tx) => {
      const lines: { productId: string; variantId: string | null; name: string; qty: number; pricePaise: number }[] = [];
      for (const item of input.items) {
        const qty = Math.floor(item.qty);
        if (qty < 1 || qty > 20) throw new Error("Each item must have a quantity from 1 to 20.");
        const product = await tx.product.findFirst({
          where: { id: item.productId, storeId: store.id, active: true },
          include: { variants: true },
        });
        if (!product) throw new Error("A product in the cart is no longer available.");
        const variant = item.variantId ? product.variants.find((entry) => entry.id === item.variantId) : null;
        if (item.variantId && !variant) throw new Error(`Choose a valid option for ${product.name}.`);
        const available = variant ? variant.stock : product.stock;
        if (available < qty) throw new Error(`${product.name} has only ${available} left.`);
        const base = variant?.pricePaise ?? product.pricePaise;
        const pricePaise = sellingPaise(base, product.discountPercent);
        lines.push({
          productId: product.id,
          variantId: variant?.id ?? null,
          name: variant ? `${product.name} (${variant.name})` : product.name,
          qty,
          pricePaise,
        });
        if (variant) {
          await tx.variant.update({ where: { id: variant.id }, data: { stock: variant.stock - qty } });
          await tx.product.update({ where: { id: product.id }, data: { stock: product.stock - qty } });
        } else {
          await tx.product.update({ where: { id: product.id }, data: { stock: product.stock - qty } });
        }
      }
      const count = await tx.order.count({ where: { storeId: store.id } });
      const number = `LY${String(1001 + count)}`;
      const subtotalPaise = lines.reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
      const message = statusCopy(store.name, number, "placed");
      return tx.order.create({
        data: {
          storeId: store.id,
          number,
          customerName: input.customerName.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
          address: input.address.trim(),
          status: "placed",
          subtotalPaise,
          items: { create: lines },
          events: { create: { status: "placed", channel: "email", message, sentTo: input.email.trim() } },
        },
      });
    });
    await prisma.activity.create({
      data: { storeId: store.id, message: `New order ${order.number} from ${order.customerName}.` },
    });
    return { orderId: order.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not place the order." };
  }
}

export async function updateOrderStatus(storeId: string, orderId: string, status: string) {
  const member = await requireMember(storeId);
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return { error: "Unknown status." };
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    include: { items: true },
  });
  if (!order) return { error: "That order is not in this store." };
  if (order.status === status) return { ok: true };

  try {
    await prisma.$transaction(async (tx) => {
    if (order.status === "cancelled" && status !== "cancelled") {
      throw new Error("A cancelled order stays cancelled. Create a new order if needed.");
    }
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        if (item.variantId) {
          const variant = await tx.variant.findUnique({ where: { id: item.variantId } });
          if (variant) await tx.variant.update({ where: { id: variant.id }, data: { stock: variant.stock + item.qty } });
        }
        if (item.productId) {
          const product = await tx.product.findFirst({ where: { id: item.productId, storeId } });
          if (product) await tx.product.update({ where: { id: product.id }, data: { stock: product.stock + item.qty } });
        }
      }
    }
    const message = statusCopy(member.store.name, order.number, status);
    await tx.order.update({ where: { id: order.id }, data: { status } });
    await tx.orderEvent.create({
      data: { orderId: order.id, status, channel: "email", message, sentTo: order.email },
    });
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update the order." };
  }
  await prisma.activity.create({
    data: { storeId, message: `Order ${order.number} marked ${status}. Email saved for ${order.email}.` },
  });
  return { ok: true };
}
