export const TEMPLATE_COLUMNS = [
  "name",
  "category",
  "description",
  "price",
  "compare_at_price",
  "sku",
  "stock",
  "image_url",
  "discount_percent",
] as const;

export const IMPORT_FIELDS = [
  "name",
  "category",
  "description",
  "price",
  "compareAt",
  "sku",
  "stock",
  "imageUrl",
  "discount",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

export type SheetRow = {
  rowNumber: number;
  values: Record<ImportField, string>;
};

export type ImportError = { row: number; field: string; message: string };

export type ValidProduct = {
  rowNumber: number;
  name: string;
  category: string;
  description: string;
  priceRupees: number;
  compareAtRupees: number | null;
  sku: string;
  stock: number;
  imageUrl: string;
  discountPercent: number;
  createCategory: boolean;
};

const ALIASES: Record<ImportField, string[]> = {
  name: ["name", "product", "product name", "item", "item name", "title"],
  category: ["category", "categories", "collection", "type"],
  description: ["description", "details", "desc", "product description"],
  price: ["price", "selling price", "sale price", "rate", "amount", "unit price"],
  compareAt: ["compare at price", "compare price", "mrp", "list price", "original price"],
  sku: ["sku", "code", "item code", "product code", "barcode"],
  stock: ["stock", "qty", "quantity", "inventory", "on hand"],
  imageUrl: ["image", "image url", "photo", "picture", "image link"],
  discount: ["discount", "discount percent", "discount %", "off"],
};

export function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/[%₹]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function suggestMapping(headers: string[]): Record<ImportField, string | null> {
  const mapping = Object.fromEntries(IMPORT_FIELDS.map((field) => [field, null])) as Record<
    ImportField,
    string | null
  >;
  const used = new Set<string>();

  const ranked = [...IMPORT_FIELDS].sort((a, b) => {
    const score = (field: ImportField) => Math.max(...ALIASES[field].map((alias) => alias.length));
    return score(b) - score(a);
  });

  for (const field of ranked) {
    const match = headers.find((header) => {
      if (used.has(header)) return false;
      const normalized = normalizeHeader(header);
      if (field === "price" && (normalized === "mrp" || normalized.includes("compare"))) return false;
      return ALIASES[field].some((alias) => normalized === normalizeHeader(alias));
    });
    if (match) {
      mapping[field] = match;
      used.add(match);
    }
  }

  if (!mapping.price) {
    const loose = headers.find((header) => {
      if (used.has(header)) return false;
      const normalized = normalizeHeader(header);
      return normalized.includes("price") && !normalized.includes("compare") && normalized !== "mrp";
    });
    if (loose) mapping.price = loose;
  }

  return mapping;
}

export function applyMapping(
  headers: string[],
  rawRows: string[][],
  mapping: Partial<Record<ImportField, string | null>>,
): SheetRow[] {
  const index = new Map(headers.map((header, i) => [header, i]));
  const rows: SheetRow[] = [];
  rawRows.forEach((raw, i) => {
    const values = Object.fromEntries(IMPORT_FIELDS.map((field) => ["", ""])) as unknown as Record<
      ImportField,
      string
    >;
    for (const field of IMPORT_FIELDS) values[field] = "";
    for (const field of IMPORT_FIELDS) {
      const header = mapping[field];
      if (!header) continue;
      const column = index.get(header);
      if (column === undefined) continue;
      values[field] = String(raw[column] ?? "").trim();
    }
    if (IMPORT_FIELDS.every((field) => !values[field])) return;
    rows.push({ rowNumber: i + 2, values });
  });
  return rows;
}

function parseMoney(value: string) {
  const cleaned = value.replace(/₹/g, "").replace(/rs\.?/gi, "").replace(/,/g, "").trim();
  if (!cleaned) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

export function evaluateRows(
  rows: SheetRow[],
  options: {
    existingSkus: string[];
    knownCategories: string[];
    createMissingCategories: boolean;
  },
): { valid: ValidProduct[]; errors: ImportError[] } {
  const errors: ImportError[] = [];
  const valid: ValidProduct[] = [];
  const seenSku = new Set(options.existingSkus.map((sku) => sku.toLowerCase()).filter(Boolean));
  const seenName = new Set<string>();
  const known = new Set(options.knownCategories.map((name) => name.toLowerCase()));

  for (const row of rows) {
    const rowErrors: ImportError[] = [];
    const { values } = row;
    const name = values.name.trim();
    const category = values.category.trim();
    const sku = values.sku.trim();
    const nameKey = name.toLowerCase();

    if (!name) rowErrors.push({ row: row.rowNumber, field: "name", message: "Product name is missing." });
    if (name && seenName.has(nameKey)) {
      rowErrors.push({ row: row.rowNumber, field: "name", message: "Duplicate product name in this file." });
    }

    if (!category) {
      rowErrors.push({ row: row.rowNumber, field: "category", message: "Category is missing." });
    }

    const price = parseMoney(values.price);
    if (price === null || Number.isNaN(price) || price <= 0) {
      rowErrors.push({
        row: row.rowNumber,
        field: "price",
        message: values.price ? `Price "${values.price}" is not a valid amount.` : "Price is missing.",
      });
    }

    let compareAt: number | null = null;
    if (values.compareAt) {
      const parsed = parseMoney(values.compareAt);
      if (parsed === null || Number.isNaN(parsed) || parsed <= 0) {
        rowErrors.push({
          row: row.rowNumber,
          field: "compare_at_price",
          message: `Compare-at price "${values.compareAt}" is not a valid amount.`,
        });
      } else {
        compareAt = parsed;
      }
    }

    let stock = 0;
    if (values.stock) {
      if (!/^\d+$/.test(values.stock)) {
        rowErrors.push({
          row: row.rowNumber,
          field: "stock",
          message: `Stock "${values.stock}" must be a whole number, 0 or more.`,
        });
      } else {
        stock = Number(values.stock);
      }
    }

    let discount = 0;
    if (values.discount) {
      if (!/^\d+$/.test(values.discount) || Number(values.discount) > 90) {
        rowErrors.push({
          row: row.rowNumber,
          field: "discount_percent",
          message: "Discount must be a whole number from 0 to 90.",
        });
      } else {
        discount = Number(values.discount);
      }
    }

    if (sku && seenSku.has(sku.toLowerCase())) {
      rowErrors.push({ row: row.rowNumber, field: "sku", message: `SKU "${sku}" is duplicated.` });
    }

    const createCategory = Boolean(category) && !known.has(category.toLowerCase());
    if (createCategory && !options.createMissingCategories) {
      rowErrors.push({
        row: row.rowNumber,
        field: "category",
        message: `Category "${category}" is not in this store.`,
      });
    }

    if (values.imageUrl && !/^https?:\/\//i.test(values.imageUrl)) {
      rowErrors.push({
        row: row.rowNumber,
        field: "image_url",
        message: "Image URL must start with http:// or https://.",
      });
    }

    if (rowErrors.length) {
      errors.push(...rowErrors);
      continue;
    }

    if (name) seenName.add(nameKey);
    if (sku) seenSku.add(sku.toLowerCase());
    valid.push({
      rowNumber: row.rowNumber,
      name,
      category,
      description: values.description.trim(),
      priceRupees: price as number,
      compareAtRupees: compareAt,
      sku,
      stock,
      imageUrl: values.imageUrl.trim(),
      discountPercent: discount,
      createCategory,
    });
  }

  return { valid, errors };
}

export function errorsToCsv(errors: ImportError[]) {
  const lines = ["row,field,message"];
  for (const error of errors) {
    lines.push([error.row, error.field, `"${error.message.replace(/"/g, '""')}"`].join(","));
  }
  return lines.join("\n");
}
