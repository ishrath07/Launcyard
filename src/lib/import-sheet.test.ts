import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyMapping, evaluateRows, suggestMapping } from "./import-sheet";

describe("spreadsheet mapping", () => {
  it("maps messy headers to the template fields", () => {
    const headers = ["Product Name", "Selling Price (INR)", "Qty", "Item Code", "Collection", "MRP"];
    const mapping = suggestMapping(headers);
    assert.equal(mapping.name, "Product Name");
    assert.equal(mapping.price, "Selling Price (INR)");
    assert.equal(mapping.stock, "Qty");
    assert.equal(mapping.sku, "Item Code");
    assert.equal(mapping.category, "Collection");
    assert.equal(mapping.compareAt, "MRP");
  });
});

describe("spreadsheet row checks", () => {
  const headers = ["name", "category", "price", "stock", "sku"];
  const mapping = {
    name: "name",
    category: "category",
    price: "price",
    stock: "stock",
    sku: "sku",
  };

  it("reports bad prices, missing columns, and duplicate rows", () => {
    const raw = [
      ["Brass Lamp", "Home", "1,299", "4", "LAMP-1"],
      ["", "Home", "10", "1", "X"],
      ["Free Bowl", "Home", "free", "2", "BOWL"],
      ["Brass Lamp", "Home", "1299", "1", "LAMP-2"],
      ["Mystery Mug", "Unknown", "199", "-3", "MUG"],
      ["Old Sku", "Home", "100", "1", "LAMP-1"],
    ];
    const rows = applyMapping(headers, raw, mapping);
    const { valid, errors } = evaluateRows(rows, {
      existingSkus: [],
      knownCategories: ["Home"],
      createMissingCategories: false,
    });

    assert.equal(valid.length, 1);
    assert.equal(valid[0].name, "Brass Lamp");
    assert.equal(valid[0].priceRupees, 1299);
    assert.ok(errors.some((error) => error.field === "name" && error.message.includes("missing")));
    assert.ok(errors.some((error) => error.message.includes("free")));
    assert.ok(errors.some((error) => error.message.includes("Duplicate product name")));
    assert.ok(errors.some((error) => error.message.includes("Unknown")));
    assert.ok(errors.some((error) => error.field === "stock"));
    assert.ok(errors.some((error) => error.message.includes("duplicated")));
  });
});
