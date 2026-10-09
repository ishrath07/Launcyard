import { addDays, periodLabel, periodRange, startOfWeek } from "./dates";
import { formatINR } from "./money";

export type Period = "today" | "week" | "month" | "all";

export type Intent =
  | { type: "top_products"; period: Period; limit: number }
  | { type: "low_stock"; threshold: number }
  | { type: "revenue_compare" }
  | { type: "revenue"; period: Period }
  | { type: "orders"; period: Period }
  | { type: "product_lookup"; query: string }
  | { type: "unknown" };

export type EvidenceRow = Record<string, string | number>;

export type Answer = {
  text: string;
  source: string;
  evidence: EvidenceRow[];
  refused: boolean;
};

export type SalesFacts = {
  rows: { name: string; units: number; revenuePaise: number }[];
  periodLabel: string;
};

export type StockFacts = {
  rows: { name: string; sku: string; stock: number }[];
  threshold: number;
  productCount: number;
};

export type RevenueFacts = { revenuePaise: number; orders: number; periodLabel: string };

export type CompareFacts = {
  thisWeekPaise: number;
  lastWeekPaise: number;
  thisWeekOrders: number;
  lastWeekOrders: number;
  thisLabel: string;
  lastLabel: string;
};

export type LookupFacts = {
  query: string;
  matches: { name: string; sku: string; stock: number; pricePaise: number }[];
};

const REFUSAL =
  "I don't have that data. I can answer questions about this store's sales, orders, revenue, and stock.";

export function parseQuestion(input: string, now = new Date()): Intent {
  const text = input.toLowerCase().replace(/[?!.]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return { type: "unknown" };

  const period = readPeriod(text);
  const limit = readLimit(text);

  if (/last week/.test(text) && /this week/.test(text) && /revenue|sales|earned/.test(text)) {
    return { type: "revenue_compare" };
  }

  if (/low/.test(text) && /stock|inventory/.test(text)) {
    const under = text.match(/under\s+(\d+)|below\s+(\d+)|less than\s+(\d+)/);
    const threshold = under ? Number(under[1] || under[2] || under[3]) : 5;
    return { type: "low_stock", threshold };
  }

  if (/top/.test(text) && /product|sell|selling/.test(text)) {
    return { type: "top_products", period, limit };
  }

  if (/revenue|sales|earned|turnover/.test(text)) {
    return { type: "revenue", period };
  }

  if (/how many orders|order count|number of orders|orders/.test(text)) {
    return { type: "orders", period };
  }

  const lookup = text.match(/(?:price of|stock of|how many)\s+(.+?)(?:\s+left)?$/);
  if (lookup?.[1]) return { type: "product_lookup", query: lookup[1].trim() };

  void now;
  return { type: "unknown" };
}

function readPeriod(text: string): Period {
  if (/today/.test(text)) return "today";
  if (/this week|last 7/.test(text)) return "week";
  if (/this month|month/.test(text)) return "month";
  if (/all time|overall|ever/.test(text)) return "all";
  return "month";
}

function readLimit(text: string) {
  const match = text.match(/top\s+(\d+)/);
  const value = match ? Number(match[1]) : 5;
  return Math.min(10, Math.max(1, value));
}

export function compareWindows(now = new Date()) {
  const thisFrom = startOfWeek(now);
  const thisTo = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
  const lastFrom = addDays(thisFrom, -7);
  return {
    thisFrom,
    thisTo,
    lastFrom,
    lastTo: thisFrom,
    thisLabel: periodLabel(thisFrom, thisTo),
    lastLabel: periodLabel(lastFrom, thisFrom),
  };
}

export function answerTopProducts(facts: SalesFacts, limit: number): Answer {
  if (!facts.rows.length) {
    return {
      text: `I don't have that data. There are no paid orders from ${facts.periodLabel}.`,
      source: `Orders from ${facts.periodLabel}, excluding cancelled.`,
      evidence: [],
      refused: true,
    };
  }
  const rows = facts.rows.slice(0, limit);
  const list = rows.map((row, index) => `${index + 1}. ${row.name} — ${row.units} sold, ${formatINR(row.revenuePaise)}`).join(" ");
  return {
    text: `Top ${rows.length} selling ${rows.length === 1 ? "product" : "products"} from ${facts.periodLabel}: ${list}`,
    source: `Sum of order line items from ${facts.periodLabel}, excluding cancelled orders.`,
    evidence: rows.map((row) => ({
      product: row.name,
      units: row.units,
      revenue: formatINR(row.revenuePaise),
    })),
    refused: false,
  };
}

export function answerLowStock(facts: StockFacts): Answer {
  if (facts.productCount === 0) {
    return {
      text: "I don't have that data. This store has no products yet.",
      source: "Product stock for this store only.",
      evidence: [],
      refused: true,
    };
  }
  if (!facts.rows.length) {
    return {
      text: `No products are at or below ${facts.threshold} in stock.`,
      source: `Products and variants in this store with stock at or below ${facts.threshold}.`,
      evidence: [],
      refused: false,
    };
  }
  return {
    text: `${facts.rows.length} product${facts.rows.length === 1 ? "" : "s"} at or below ${facts.threshold} in stock.`,
    source: `Products and variants in this store with stock at or below ${facts.threshold}.`,
    evidence: facts.rows.map((row) => ({ product: row.name, sku: row.sku || "—", stock: row.stock })),
    refused: false,
  };
}

export function answerRevenue(facts: RevenueFacts): Answer {
  if (facts.orders === 0) {
    return {
      text: `I don't have that data. There are no orders from ${facts.periodLabel}.`,
      source: `Orders from ${facts.periodLabel}, excluding cancelled.`,
      evidence: [],
      refused: true,
    };
  }
  return {
    text: `Revenue from ${facts.periodLabel} is ${formatINR(facts.revenuePaise)} across ${facts.orders} ${facts.orders === 1 ? "order" : "orders"}.`,
    source: `Sum of non-cancelled order totals from ${facts.periodLabel}.`,
    evidence: [{ period: facts.periodLabel, orders: facts.orders, revenue: formatINR(facts.revenuePaise) }],
    refused: false,
  };
}

export function answerCompare(facts: CompareFacts): Answer {
  const delta = facts.thisWeekPaise - facts.lastWeekPaise;
  const direction = delta === 0 ? "unchanged" : delta > 0 ? "up" : "down";
  return {
    text: `This week (${facts.thisLabel}) revenue is ${formatINR(facts.thisWeekPaise)} from ${facts.thisWeekOrders} ${facts.thisWeekOrders === 1 ? "order" : "orders"}. Last week (${facts.lastLabel}) was ${formatINR(facts.lastWeekPaise)} from ${facts.lastWeekOrders} ${facts.lastWeekOrders === 1 ? "order" : "orders"}. Revenue is ${direction} by ${formatINR(Math.abs(delta))}.`,
    source: "Non-cancelled orders. Weeks start on Monday in the server's local timezone.",
    evidence: [
      { period: `This week (${facts.thisLabel})`, orders: facts.thisWeekOrders, revenue: formatINR(facts.thisWeekPaise) },
      { period: `Last week (${facts.lastLabel})`, orders: facts.lastWeekOrders, revenue: formatINR(facts.lastWeekPaise) },
    ],
    refused: false,
  };
}

export function answerOrders(facts: RevenueFacts): Answer {
  if (facts.orders === 0) {
    return {
      text: `I don't have that data. There are no orders from ${facts.periodLabel}.`,
      source: `Orders from ${facts.periodLabel}, excluding cancelled.`,
      evidence: [],
      refused: true,
    };
  }
  return {
    text: `${facts.orders} ${facts.orders === 1 ? "order" : "orders"} from ${facts.periodLabel}, totalling ${formatINR(facts.revenuePaise)}.`,
    source: `Non-cancelled orders from ${facts.periodLabel}.`,
    evidence: [{ period: facts.periodLabel, orders: facts.orders, revenue: formatINR(facts.revenuePaise) }],
    refused: false,
  };
}

export function answerLookup(facts: LookupFacts): Answer {
  if (!facts.matches.length) {
    return {
      text: `I don't have that data. Nothing in this store matches "${facts.query}".`,
      source: "Product name and SKU search inside this store.",
      evidence: [],
      refused: true,
    };
  }
  return {
    text: facts.matches
      .map((match) => `${match.name}: ${formatINR(match.pricePaise)}, ${match.stock} in stock.`)
      .join(" "),
    source: `Products in this store matching "${facts.query}".`,
    evidence: facts.matches.map((match) => ({
      product: match.name,
      sku: match.sku || "—",
      stock: match.stock,
      price: formatINR(match.pricePaise),
    })),
    refused: false,
  };
}

export function refuse(): Answer {
  return { text: REFUSAL, source: "No store query was run.", evidence: [], refused: true };
}

export function rangeFor(period: Period, now = new Date()) {
  const range = periodRange(period, now);
  return { ...range, label: periodLabel(range.from, range.to) };
}
