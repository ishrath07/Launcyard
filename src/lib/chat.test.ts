import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  answerCompare,
  answerLowStock,
  answerTopProducts,
  parseQuestion,
  refuse,
} from "./chat";

describe("owner assistant", () => {
  it("understands the three brief questions", () => {
    assert.deepEqual(parseQuestion("What are my top 5 selling products this month?"), {
      type: "top_products",
      period: "month",
      limit: 5,
    });
    assert.deepEqual(parseQuestion("Which products are low on stock?"), {
      type: "low_stock",
      threshold: 5,
    });
    assert.equal(parseQuestion("Revenue last week vs this week?").type, "revenue_compare");
  });

  it("does not invent a ranking when there are no orders", () => {
    const answer = answerTopProducts({ rows: [], periodLabel: "1 Oct 2026 to 9 Oct 2026" }, 5);
    assert.equal(answer.refused, true);
    assert.match(answer.text, /don't have that data/i);
    assert.equal(answer.evidence.length, 0);
  });

  it("builds the revenue comparison only from the supplied totals", () => {
    const answer = answerCompare({
      thisWeekPaise: 150000,
      lastWeekPaise: 100000,
      thisWeekOrders: 2,
      lastWeekOrders: 1,
      thisLabel: "6 Oct 2026 to 9 Oct 2026",
      lastLabel: "29 Sep 2026 to 5 Oct 2026",
    });
    assert.match(answer.text, /₹1,500/);
    assert.match(answer.text, /₹1,000/);
    assert.equal(answer.evidence.length, 2);
  });

  it("says when the catalog is empty instead of guessing stock", () => {
    const answer = answerLowStock({ rows: [], threshold: 5, productCount: 0 });
    assert.match(answer.text, /don't have that data/i);
  });

  it("refuses questions outside store data", () => {
    assert.equal(parseQuestion("Who will win the cricket match?").type, "unknown");
    assert.match(refuse().text, /don't have that data/i);
  });
});
