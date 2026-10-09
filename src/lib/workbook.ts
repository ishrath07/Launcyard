import * as XLSX from "xlsx";
import { TEMPLATE_COLUMNS } from "@/lib/import-sheet";

export function parseWorkbook(buffer: Buffer) {
  const book = XLSX.read(buffer, { type: "buffer" });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) return { error: "The file has no sheets." as const };
  const table = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  const [headerRow, ...rest] = table;
  const headers = (headerRow ?? []).map((cell) => String(cell).trim()).filter(Boolean);
  if (!headers.length) return { error: "The first row needs column headers." as const };
  const raw = rest
    .map((row) => headers.map((_, index) => String(row[index] ?? "").trim()))
    .filter((row) => row.some(Boolean));
  if (raw.length > 500) return { error: "Import up to 500 products at a time." as const };
  return { headers, raw };
}

export function templateWorkbook() {
  const examples = [
    ["Handloom Cotton Kurta", "Fashion", "Breathable cotton kurta", "1899", "2499", "FAS-KURTA", "24", "", "10"],
    ["Filter Coffee Powder", "Grocery", "80:20 blend, 250 g", "275", "", "GRO-COFF", "20", "", ""],
  ];
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    [...TEMPLATE_COLUMNS],
    ...examples,
  ]);
  XLSX.utils.book_append_sheet(book, sheet, "Products");
  const notes = XLSX.utils.aoa_to_sheet([
    ["Delete the sample rows before you import your own products."],
    ["price and compare_at_price are in rupees, for example 1899 or 1899.50."],
    ["stock and discount_percent are whole numbers. Discount cannot be above 90."],
    ["category must match a store category, or you can choose to create new ones at import."],
    ["Wrong headers are fine if you map the columns on the next screen."],
  ]);
  XLSX.utils.book_append_sheet(book, notes, "Notes");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
