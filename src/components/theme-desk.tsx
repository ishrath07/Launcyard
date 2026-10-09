"use client";

import { useState } from "react";
import { ThemePicker, ThemePreview } from "@/components/theme-preview";
import { saveTheme } from "@/server/catalog-actions";

export function ThemeDesk({
  storeId,
  initial,
  storeName,
  city,
}: {
  storeId: string;
  initial: string;
  storeName: string;
  city: string;
}) {
  const [themeId, setThemeId] = useState(initial);
  const [message, setMessage] = useState("");
  return (
    <div>
      <p className="muted">Preview first. The live store changes only after you confirm.</p>
      <ThemePicker value={themeId} onChange={setThemeId} />
      <div style={{ margin: "12px 0" }}>
        <ThemePreview themeId={themeId} storeName={storeName} city={city} />
      </div>
      <button className="btn" type="button" onClick={async () => {
        const result = await saveTheme(storeId, themeId);
        setMessage(result.error ?? "Theme saved on the live store.");
      }}>Confirm theme</button>
      {message && <p>{message}</p>}
    </div>
  );
}
