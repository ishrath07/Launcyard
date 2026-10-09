"use client";

import { useState } from "react";
import { saveContent } from "@/server/catalog-actions";

export function ContentForm({
  storeId,
  store,
  sections,
}: {
  storeId: string;
  store: {
    logoData: string;
    announcement: string;
    bannerTitle: string;
    bannerSubtitle: string;
    aboutText: string;
    footerNote: string;
    phone: string;
    email: string;
    whatsapp: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  sections: { id: string; kind: string; title: string; body: string; enabled: boolean }[];
}) {
  const [logoData, setLogoData] = useState(store.logoData);
  const [rows, setRows] = useState(sections);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form className="panel" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      const data = new FormData(event.currentTarget);
      const result = await saveContent({
        storeId,
        logoData,
        announcement: String(data.get("announcement") ?? ""),
        bannerTitle: String(data.get("bannerTitle") ?? ""),
        bannerSubtitle: String(data.get("bannerSubtitle") ?? ""),
        aboutText: String(data.get("aboutText") ?? ""),
        footerNote: String(data.get("footerNote") ?? ""),
        phone: String(data.get("phone") ?? ""),
        email: String(data.get("email") ?? ""),
        whatsapp: String(data.get("whatsapp") ?? ""),
        addressLine: String(data.get("addressLine") ?? ""),
        city: String(data.get("city") ?? ""),
        state: String(data.get("state") ?? ""),
        pincode: String(data.get("pincode") ?? ""),
        sections: rows,
      });
      setPending(false);
      setMessage(result.error ?? "Saved. The live store is using this content.");
    }}>
      {message && <p>{message}</p>}
      <label className="field"><span>New logo (under 300 KB)</span>
        <input type="file" accept="image/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > 300 * 1024) { setMessage("Logo must be under 300 KB."); return; }
          const reader = new FileReader();
          reader.onload = () => setLogoData(String(reader.result));
          reader.readAsDataURL(file);
        }} />
      </label>
      {logoData && <img alt="" src={logoData} style={{ width: 72, height: 72, objectFit: "cover" }} />}
      <label className="field"><span>Announcement bar</span><input name="announcement" defaultValue={store.announcement} /></label>
      <label className="field"><span>Banner title</span><input name="bannerTitle" defaultValue={store.bannerTitle} /></label>
      <label className="field"><span>Banner subtitle</span><input name="bannerSubtitle" defaultValue={store.bannerSubtitle} /></label>
      <label className="field"><span>About</span><textarea name="aboutText" defaultValue={store.aboutText} /></label>
      <label className="field"><span>Footer note</span><input name="footerNote" defaultValue={store.footerNote} /></label>
      <div className="grid-2">
        <label className="field"><span>Phone</span><input name="phone" defaultValue={store.phone} /></label>
        <label className="field"><span>Email</span><input name="email" defaultValue={store.email} /></label>
        <label className="field"><span>WhatsApp</span><input name="whatsapp" defaultValue={store.whatsapp} /></label>
        <label className="field"><span>PIN code</span><input name="pincode" defaultValue={store.pincode} /></label>
      </div>
      <label className="field"><span>Address</span><input name="addressLine" defaultValue={store.addressLine} /></label>
      <div className="grid-2">
        <label className="field"><span>City</span><input name="city" defaultValue={store.city} /></label>
        <label className="field"><span>State</span><input name="state" defaultValue={store.state} /></label>
      </div>
      <h2>Homepage sections</h2>
      {rows.map((section, index) => (
        <div key={section.id} className="panel" style={{ marginBottom: 8 }}>
          <strong>{section.kind}</strong>
          <label style={{ display: "flex", gap: 8 }}><input type="checkbox" checked={section.enabled} onChange={(event) => setRows(rows.map((row, i) => i === index ? { ...row, enabled: event.target.checked } : row))} /> Show this section</label>
          <input className="input" value={section.title} onChange={(event) => setRows(rows.map((row, i) => i === index ? { ...row, title: event.target.value } : row))} />
          <textarea className="input" style={{ marginTop: 8 }} value={section.body} onChange={(event) => setRows(rows.map((row, i) => i === index ? { ...row, body: event.target.value } : row))} />
        </div>
      ))}
      <button className="btn" disabled={pending} type="submit">{pending ? "Saving…" : "Save content"}</button>
    </form>
  );
}
