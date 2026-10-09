"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SheetImporter, type SheetState } from "@/components/sheet-importer";
import { importIntoStore, seedSamples } from "@/server/store-actions";

export function ImportDesk({ storeId, categories }: { storeId: string; categories: string[] }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div>
      {message && <p>{message}</p>}
      <div className="panel" style={{ marginBottom: 12 }}>
        <h2 style={{ marginTop: 0 }}>Sample products</h2>
        <p className="muted">Fills built-in categories you already selected. Existing SKUs are skipped.</p>
        <button className="btn" type="button" onClick={async () => {
          setPending(true);
          const result = await seedSamples(storeId);
          setPending(false);
          setMessage(result.error ?? `Added ${result.added} sample products.`);
          router.refresh();
        }} disabled={pending}>Import sample products</button>
      </div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Excel / CSV</h2>
        <SheetImporter storeId={storeId} knownCategories={categories} onChange={setSheet} />
        <button className="btn" type="button" style={{ marginTop: 12 }} disabled={pending || !sheet?.validCount} onClick={async () => {
          if (!sheet) return;
          setPending(true);
          const result = await importIntoStore({
            storeId,
            headers: sheet.headers,
            raw: sheet.raw,
            mapping: sheet.mapping,
            createMissingCategories: sheet.createMissingCategories,
          });
          setPending(false);
          setMessage(result.error ?? `Imported ${result.imported} products. ${result.errors?.length ?? 0} rows were skipped.`);
          router.refresh();
        }}>Import valid rows</button>
      </div>
    </div>
  );
}
