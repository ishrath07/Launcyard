"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProduct } from "@/server/catalog-actions";

type VariantDraft = { name: string; stock: string; price: string };

export function ProductEditor({
  storeId,
  categories,
  product,
}: {
  storeId: string;
  categories: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    categoryId: string | null;
    description: string;
    pricePaise: number;
    compareAtPaise: number | null;
    sku: string;
    stock: number;
    imageUrl: string;
    discountPercent: number;
    active: boolean;
    variants: { name: string; stock: number; pricePaise: number | null }[];
  };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.map((variant) => ({
      name: variant.name,
      stock: String(variant.stock),
      price: variant.pricePaise ? String(variant.pricePaise / 100) : "",
    })) ?? [],
  );

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const result = await saveProduct({
      storeId,
      productId: product?.id,
      name: String(formData.get("name") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: String(formData.get("price") ?? ""),
      compareAt: String(formData.get("compareAt") ?? ""),
      sku: String(formData.get("sku") ?? ""),
      stock: String(formData.get("stock") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
      discount: String(formData.get("discount") ?? "0"),
      active: formData.get("active") === "on",
      variants,
    });
    setPending(false);
    if (result.error) return setError(result.error);
    router.push(`/admin/${storeId}/products`);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="panel">
      {error && <p className="error">{error}</p>}
      <label className="field"><span>Name</span><input name="name" defaultValue={product?.name} required /></label>
      <label className="field"><span>Category</span>
        <select name="categoryId" defaultValue={product?.categoryId ?? ""}>
          <option value="">Uncategorised</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="field"><span>Description</span><textarea name="description" defaultValue={product?.description} /></label>
      <div className="grid-2">
        <label className="field"><span>Price (₹)</span><input name="price" defaultValue={product ? product.pricePaise / 100 : ""} required /></label>
        <label className="field"><span>Compare-at (₹)</span><input name="compareAt" defaultValue={product?.compareAtPaise ? product.compareAtPaise / 100 : ""} /></label>
        <label className="field"><span>Discount %</span><input name="discount" defaultValue={product?.discountPercent ?? 0} /></label>
        <label className="field"><span>Stock</span><input name="stock" defaultValue={product?.stock ?? 0} /></label>
        <label className="field"><span>SKU</span><input name="sku" defaultValue={product?.sku} /></label>
        <label className="field"><span>Image URL</span><input name="imageUrl" defaultValue={product?.imageUrl} /></label>
      </div>
      <label style={{ display: "flex", gap: 8 }}><input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Visible in the store</label>
      <h3>Variants</h3>
      <p className="muted">Optional. If you add variants, their stock replaces the single stock count.</p>
      {variants.map((variant, index) => (
        <div key={index} className="grid-2">
          <input className="input" placeholder="Name, e.g. Medium" value={variant.name} onChange={(event) => setVariants(variants.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} />
          <input className="input" placeholder="Stock" value={variant.stock} onChange={(event) => setVariants(variants.map((item, i) => i === index ? { ...item, stock: event.target.value } : item))} />
          <input className="input" placeholder="Price override ₹" value={variant.price} onChange={(event) => setVariants(variants.map((item, i) => i === index ? { ...item, price: event.target.value } : item))} />
          <button className="btn-ghost" type="button" onClick={() => setVariants(variants.filter((_, i) => i !== index))}>Remove</button>
        </div>
      ))}
      <button className="btn-ghost" type="button" onClick={() => setVariants([...variants, { name: "", stock: "0", price: "" }])}>Add variant</button>
      <div style={{ marginTop: 12 }}><button className="btn" disabled={pending} type="submit">{pending ? "Saving…" : "Save product"}</button></div>
    </form>
  );
}
