"use client";

import { useMemo, useState } from "react";
import { BUSINESS_TYPES, PRESET_CATEGORIES } from "@/lib/catalog";
import { slugError, slugify } from "@/lib/slug";
import { launchStore, slugAvailable } from "@/server/store-actions";
import { ThemePicker, ThemePreview } from "@/components/theme-preview";
import { SheetImporter, type SheetState } from "@/components/sheet-importer";

const STEPS = ["Store", "Contact", "Logo", "Categories", "Products", "Theme", "Review"];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagline, setTagline] = useState("");
  const [businessType, setBusinessType] = useState("Retail");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [logoData, setLogoData] = useState("");
  const [picked, setPicked] = useState<string[]>(["Fashion"]);
  const [custom, setCustom] = useState("");
  const [customs, setCustoms] = useState<string[]>([]);
  const [productMode, setProductMode] = useState<"dummy" | "sheet" | "later">("dummy");
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [themeId, setThemeId] = useState("harbor");

  const categories = useMemo(
    () => [
      ...picked.map((item) => ({ name: item, custom: false })),
      ...customs.map((item) => ({ name: item, custom: true })),
    ],
    [picked, customs],
  );

  async function next() {
    setError("");
    if (step === 0) {
      if (name.trim().length < 2) return setError("Enter a store name.");
      if (!businessType) return setError("Choose a business type.");
      const wanted = slugify(slug || name);
      const issue = slugError(wanted);
      if (issue) return setError(issue);
      const check = await slugAvailable(wanted);
      if (!check.ok) return setError(check.error ?? "That address is taken.");
    }
    if (step === 1) {
      const digits = phone.replace(/\s/g, "").replace(/^\+91/, "");
      if (!/^\d{10}$/.test(digits)) return setError("Enter a 10-digit phone number.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid contact email.");
      if (addressLine.trim().length < 4) return setError("Enter the street address.");
      if (city.trim().length < 2) return setError("Enter the city.");
      if (!/^\d{6}$/.test(pincode.trim())) return setError("Enter a 6-digit PIN code.");
    }
    if (step === 3 && categories.length === 0) return setError("Pick at least one category.");
    if (step === 4 && productMode === "sheet" && !sheet?.validCount) {
      return setError("Upload a sheet and check the rows, or choose sample products.");
    }
    if (step === 4 && productMode === "dummy" && !categories.some((category) => PRESET_CATEGORIES.some((preset) => preset.name === category.name))) {
      return setError("Sample products are for the built-in categories. Pick one of those, or upload a sheet.");
    }
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  async function launch() {
    setPending(true);
    setError("");
    const result = await launchStore({
      name, slug: slugify(slug || name), tagline, businessType, phone, email, whatsapp,
      addressLine, city, state: stateName, pincode, logoData, categories, themeId, productMode,
      sheet: sheet ? {
        headers: sheet.headers,
        raw: sheet.raw,
        mapping: sheet.mapping,
        createMissingCategories: sheet.createMissingCategories,
      } : undefined,
    });
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="wrap" style={{ paddingBottom: "3rem" }}>
      <div className="progress">
        {STEPS.map((label, index) => (
          <button key={label} className={index === step ? "on" : ""} type="button" onClick={() => index < step && setStep(index)}>
            {index + 1}. {label}
          </button>
        ))}
      </div>
      <div className="panel">
        {error && <p className="error">{error}</p>}
        {step === 0 && (
          <>
            <h1 style={{ marginTop: 0 }}>Name the store</h1>
            <label className="field"><span>Store name</span><input value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} /></label>
            <label className="field"><span>Store address</span><input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} /></label>
            <p className="muted">Live path: /s/{slugify(slug || name) || "your-store"}</p>
            <label className="field"><span>Business type</span>
              <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                {BUSINESS_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="field"><span>Short line on the homepage</span><input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Fresh flowers, same-day in Indiranagar" /></label>
          </>
        )}
        {step === 1 && (
          <>
            <h1 style={{ marginTop: 0 }}>How customers reach you</h1>
            <div className="grid-2">
              <label className="field"><span>Phone</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" /></label>
              <label className="field"><span>WhatsApp</span><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Optional" /></label>
            </div>
            <label className="field"><span>Contact email</span><input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="field"><span>Street address</span><input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} /></label>
            <div className="grid-2">
              <label className="field"><span>City</span><input value={city} onChange={(e) => setCity(e.target.value)} /></label>
              <label className="field"><span>State</span><input value={stateName} onChange={(e) => setStateName(e.target.value)} /></label>
            </div>
            <label className="field"><span>PIN code</span><input value={pincode} onChange={(e) => setPincode(e.target.value)} /></label>
          </>
        )}
        {step === 2 && (
          <>
            <h1 style={{ marginTop: 0 }}>Logo</h1>
            <p className="muted">PNG or JPG under 300 KB. You can skip this and add it later.</p>
            <input type="file" accept="image/*" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 300 * 1024) { setError("Logo must be under 300 KB."); return; }
              const reader = new FileReader();
              reader.onload = () => setLogoData(String(reader.result));
              reader.readAsDataURL(file);
            }} />
            {logoData && <img alt="Logo preview" src={logoData} style={{ width: 96, height: 96, objectFit: "cover", marginTop: 12, borderRadius: 12 }} />}
          </>
        )}
        {step === 3 && (
          <>
            <h1 style={{ marginTop: 0 }}>Categories</h1>
            <div className="chips">
              {PRESET_CATEGORIES.map((category) => (
                <button key={category.slug} type="button" className={picked.includes(category.name) ? "chip on" : "chip"} onClick={() => setPicked((list) => list.includes(category.name) ? list.filter((item) => item !== category.name) : [...list, category.name])}>
                  {category.name}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input className="input" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom category" />
              <button className="btn-dark" type="button" onClick={() => {
                const clean = custom.trim();
                if (clean.length < 2) return;
                if (!customs.includes(clean) && !picked.includes(clean)) setCustoms([...customs, clean]);
                setCustom("");
              }}>Add</button>
            </div>
            {!!customs.length && <p>Custom: {customs.join(", ")}</p>}
          </>
        )}
        {step === 4 && (
          <>
            <h1 style={{ marginTop: 0 }}>Products</h1>
            <div className="chips" style={{ marginBottom: 12 }}>
              {([["dummy", "Fill with sample products"], ["sheet", "Upload Excel / CSV"], ["later", "I'll add products later"]] as const).map(([id, label]) => (
                <button key={id} className={productMode === id ? "chip on" : "chip"} type="button" onClick={() => setProductMode(id)}>{label}</button>
              ))}
            </div>
            {productMode === "dummy" && <p className="muted">One click at launch adds names, photos, prices, and descriptions for the built-in categories you picked.</p>}
            {productMode === "sheet" && <SheetImporter knownCategories={categories.map((category) => category.name)} onChange={setSheet} />}
          </>
        )}
        {step === 5 && (
          <>
            <h1 style={{ marginTop: 0 }}>Theme</h1>
            <p className="muted">The preview uses the same colors, fonts, and layout as the live shop. Nothing is saved until you launch.</p>
            <ThemePicker value={themeId} onChange={setThemeId} />
            <div style={{ marginTop: 12 }}>
              <ThemePreview themeId={themeId} storeName={name} city={city} />
            </div>
          </>
        )}
        {step === 6 && (
          <>
            <h1 style={{ marginTop: 0 }}>Review and launch</h1>
            <p><strong>{name}</strong> · {businessType} · /s/{slugify(slug || name)}</p>
            <p>{addressLine}, {city} {pincode}</p>
            <p>{categories.map((category) => category.name).join(", ") || "No categories"}</p>
            <p>Products: {productMode === "dummy" ? "sample catalog" : productMode === "sheet" ? `${sheet?.validCount ?? 0} valid rows` : "later"} · Theme: {themeId}</p>
            <ThemePreview themeId={themeId} storeName={name} city={city} />
          </>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button className="btn-ghost" type="button" disabled={step === 0 || pending} onClick={() => setStep((value) => value - 1)}>Back</button>
          {step < 6 ? (
            <button className="btn" type="button" onClick={() => void next()}>Continue</button>
          ) : (
            <button className="btn" type="button" disabled={pending} onClick={() => void launch()}>{pending ? "Launching…" : "Launch store"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
