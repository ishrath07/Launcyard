"use client";

import { useState } from "react";
import { IMPORT_FIELDS, errorsToCsv, type ImportField } from "@/lib/import-sheet";
import { checkMappedRows, parseUpload } from "@/server/store-actions";

export type SheetState = {
  headers: string[];
  raw: string[][];
  mapping: Partial<Record<ImportField, string | null>>;
  createMissingCategories: boolean;
  validCount?: number;
  errors?: { row: number; field: string; message: string }[];
  preview?: { row: number; name: string; category: string; price: number; stock: number; sku: string }[];
};

const labels: Record<ImportField, string> = {
  name: "Product name",
  category: "Category",
  description: "Description",
  price: "Price (₹)",
  compareAt: "Compare-at price",
  sku: "SKU",
  stock: "Stock",
  imageUrl: "Image URL",
  discount: "Discount %",
};

export function SheetImporter({
  knownCategories,
  storeId,
  onChange,
}: {
  knownCategories: string[];
  storeId?: string;
  onChange: (state: SheetState | null) => void;
}) {
  const [state, setState] = useState<SheetState | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function update(next: SheetState | null) {
    setState(next);
    onChange(next);
  }

  async function onFile(file: File) {
    setPending(true);
    setMessage("");
    const body = new FormData();
    body.set("file", file);
    const parsed = await parseUpload(body);
    setPending(false);
    if ("error" in parsed) {
      setMessage(parsed.error ?? "Could not read that file.");
      update(null);
      return;
    }
    update({
      headers: parsed.headers,
      raw: parsed.raw,
      mapping: parsed.mapping,
      createMissingCategories: false,
    });
  }

  async function check(current: SheetState) {
    setPending(true);
    setMessage("");
    const result = await checkMappedRows({
      storeId,
      headers: current.headers,
      raw: current.raw,
      mapping: current.mapping,
      knownCategories,
      createMissingCategories: current.createMissingCategories,
    });
    setPending(false);
    if ("error" in result && result.error) {
      setMessage(result.error);
      return;
    }
    const next = { ...current, validCount: result.validCount, errors: result.errors, preview: result.preview };
    update(next);
  }

  function downloadErrors() {
    if (!state?.errors?.length) return;
    const blob = new Blob([errorsToCsv(state.errors)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "import-errors.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
        <a className="btn-ghost" href="/api/template">Download Excel template</a>
        <button
          className="btn-ghost"
          type="button"
          onClick={() => {
            const csv = "name,category,description,price,compare_at_price,sku,stock,image_url,discount_percent\n";
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "launchyard-products.csv";
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download CSV template
        </button>
      </div>
      <label className="field">
        <span>Spreadsheet (.xlsx or .csv)</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
      </label>
      {message && <p className="error">{message}</p>}
      {state && (
        <>
          <p className="muted">{state.raw.length} data rows. Map your columns, then check them. Bad rows stay out of the store.</p>
          <div className="grid-2">
            {IMPORT_FIELDS.map((field) => (
              <label key={field} className="field">
                <span>{labels[field]}</span>
                <select
                  value={state.mapping[field] ?? ""}
                  onChange={(event) =>
                    update({
                      ...state,
                      mapping: { ...state.mapping, [field]: event.target.value || null },
                      validCount: undefined,
                    })
                  }
                >
                  <option value="">Not in the file</option>
                  {state.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={state.createMissingCategories}
              onChange={(event) => update({ ...state, createMissingCategories: event.target.checked, validCount: undefined })}
            />
            Create categories from the sheet that are not in the store yet
          </label>
          <button className="btn-dark" type="button" disabled={pending} onClick={() => void check(state)}>
            {pending ? "Checking…" : "Check rows"}
          </button>
          {state.validCount !== undefined && (
            <div style={{ marginTop: 12 }}>
              <p><strong>{state.validCount}</strong> rows can be imported. <strong>{state.errors?.length ?? 0}</strong> problems found.</p>
              {!!state.preview?.length && (
                <table>
                  <thead><tr><th>Row</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead>
                  <tbody>
                    {state.preview.map((row) => (
                      <tr key={row.row}><td>{row.row}</td><td>{row.name}</td><td>{row.category}</td><td>₹{row.price}</td><td>{row.stock}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!!state.errors?.length && (
                <>
                  <table>
                    <thead><tr><th>Row</th><th>Field</th><th>Problem</th></tr></thead>
                    <tbody>
                      {state.errors.slice(0, 30).map((error, index) => (
                        <tr key={`${error.row}-${error.field}-${index}`}><td>{error.row}</td><td>{error.field}</td><td>{error.message}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn-ghost" type="button" onClick={downloadErrors}>Download error report</button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
