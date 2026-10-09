"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { sellingPaise } from "@/lib/money";
import {
  answerCompare,
  answerLookup,
  answerLowStock,
  answerOrders,
  answerRevenue,
  answerTopProducts,
  compareWindows,
  parseQuestion,
  rangeFor,
  refuse,
  type Answer,
} from "@/lib/chat";

async function salesBetween(storeId: string, from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: { storeId, status: { not: "cancelled" }, createdAt: { gte: from, lt: to } },
    include: { items: true },
  });
  const totals = new Map<string, { name: string; units: number; revenuePaise: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = totals.get(item.name) ?? { name: item.name, units: 0, revenuePaise: 0 };
      current.units += item.qty;
      current.revenuePaise += item.qty * item.pricePaise;
      totals.set(item.name, current);
    }
  }
  const rows = [...totals.values()].sort((a, b) => b.units - a.units || b.revenuePaise - a.revenuePaise);
  const revenuePaise = orders.reduce((sum, order) => sum + order.subtotalPaise, 0);
  return { rows, revenuePaise, orders: orders.length };
}

export async function askStoreAssistant(storeId: string, question: string): Promise<Answer & { error?: string }> {
  const member = await requireMember(storeId);
  if (member.role !== "OWNER") {
    return { ...refuse(), text: "Only the owner who created this store can use the assistant.", error: "owner" };
  }
  const intent = parseQuestion(question);
  let answer: Answer;

  if (intent.type === "unknown") {
    answer = refuse();
  } else if (intent.type === "top_products") {
    const range = rangeFor(intent.period);
    const facts = await salesBetween(storeId, range.from, range.to);
    answer = answerTopProducts({ rows: facts.rows, periodLabel: range.label }, intent.limit);
  } else if (intent.type === "low_stock") {
    const products = await prisma.product.findMany({
      where: { storeId },
      include: { variants: true },
    });
    const rows: { name: string; sku: string; stock: number }[] = [];
    for (const product of products) {
      if (product.variants.length) {
        for (const variant of product.variants) {
          if (variant.stock <= intent.threshold) {
            rows.push({ name: `${product.name} (${variant.name})`, sku: variant.sku || product.sku, stock: variant.stock });
          }
        }
      } else if (product.stock <= intent.threshold) {
        rows.push({ name: product.name, sku: product.sku, stock: product.stock });
      }
    }
    rows.sort((a, b) => a.stock - b.stock);
    answer = answerLowStock({ rows, threshold: intent.threshold, productCount: products.length });
  } else if (intent.type === "revenue") {
    const range = rangeFor(intent.period);
    const facts = await salesBetween(storeId, range.from, range.to);
    answer = answerRevenue({ revenuePaise: facts.revenuePaise, orders: facts.orders, periodLabel: range.label });
  } else if (intent.type === "orders") {
    const range = rangeFor(intent.period);
    const facts = await salesBetween(storeId, range.from, range.to);
    answer = answerOrders({ revenuePaise: facts.revenuePaise, orders: facts.orders, periodLabel: range.label });
  } else if (intent.type === "revenue_compare") {
    const windows = compareWindows();
    const current = await salesBetween(storeId, windows.thisFrom, windows.thisTo);
    const previous = await salesBetween(storeId, windows.lastFrom, windows.lastTo);
    answer = answerCompare({
      thisWeekPaise: current.revenuePaise,
      lastWeekPaise: previous.revenuePaise,
      thisWeekOrders: current.orders,
      lastWeekOrders: previous.orders,
      thisLabel: windows.thisLabel,
      lastLabel: windows.lastLabel,
    });
  } else {
    const products = await prisma.product.findMany({
      where: {
        storeId,
        OR: [
          { name: { contains: intent.query } },
          { sku: { contains: intent.query } },
        ],
      },
      take: 5,
    });
    answer = answerLookup({
      query: intent.query,
      matches: products.map((product) => ({
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        pricePaise: sellingPaise(product.pricePaise, product.discountPercent),
      })),
    });
  }

  await prisma.chatTurn.create({
    data: {
      storeId,
      userId: member.userId,
      question: question.trim(),
      answer: answer.text,
      evidenceJson: JSON.stringify({ source: answer.source, rows: answer.evidence }),
    },
  });
  return answer;
}
