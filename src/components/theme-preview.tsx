"use client";

import { getTheme, THEMES } from "@/lib/themes";

const samples = [
  { name: "Cotton kurta", price: "₹1,899" },
  { name: "Filter coffee", price: "₹275" },
  { name: "Yoga mat", price: "₹1,299" },
];

export function ThemePreview({
  themeId,
  storeName,
  city,
}: {
  themeId: string;
  storeName: string;
  city?: string;
}) {
  const theme = getTheme(themeId);
  return (
    <div className="storefront" data-theme={theme.id} data-layout={theme.layout} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--line)" }}>
      <div className="announce">Preview · {theme.name} · colors, type, and layout</div>
      <div style={{ padding: "0.8rem 1rem 1rem" }}>
        <div className="display" style={{ fontSize: "1.8rem" }}>{storeName || "Your store"}</div>
        <p style={{ marginTop: 0 }}>{city ? `Open in ${city}` : theme.description}</p>
        <div className="product-grid" style={{ gridTemplateColumns: theme.layout === "editorial" ? "1fr" : "1fr 1fr 1fr" }}>
          {samples.map((item) => (
            <div key={item.name} className="product-card">
              <div className="ph" />
              <div>
                <strong>{item.name}</strong>
                <div className="price">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ThemePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="grid-2">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme.id)}
          className="panel"
          style={{ textAlign: "left", borderColor: value === theme.id ? "var(--ink)" : undefined, cursor: "pointer" }}
        >
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {theme.swatches.map((color) => (
              <span key={color} style={{ width: 18, height: 18, borderRadius: 99, background: color, display: "inline-block" }} />
            ))}
          </div>
          <strong>{theme.name}</strong>
          <p className="muted" style={{ marginBottom: 0 }}>{theme.description}</p>
        </button>
      ))}
    </div>
  );
}
