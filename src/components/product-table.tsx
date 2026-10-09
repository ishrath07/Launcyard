"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCategory, bulkEditProducts, deleteProduct } from "@/server/catalog-actions";
import { formatINR, sellingPaise } from "@/lib/money";

export function ProductTable({
  storeId,
  role,
  products,
}: {
  storeId: string;
  role: string;
  products: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    pricePaise: number;
    discountPercent: number;
    active: boolean;
    category: string;
  }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div>
      {message && <p>{message}</p>}
      <form className="panel" style={{ marginBottom: 12 }} onSubmit={async (event) => {
        event.preventDefault();
        const name = String(new FormData(event.currentTarget).get("category") ?? "");
        const result = await addCategory(storeId, name);
        setMessage(result.error ?? `Added category ${name}.`);
        event.currentTarget.reset();
        router.refresh();
      }}>
        <label className="field"><span>Custom category</span><input name="category" placeholder="For example, Festive gifts" /></label>
        <button className="btn-ghost" type="submit">Add category</button>
      </form>
      <form className="panel" style={{ marginBottom: 12 }} onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await bulkEditProducts({
          storeId,
          ids: selected,
          discount: String(data.get("discount") ?? ""),
          stock: String(data.get("stock") ?? ""),
          active: String(data.get("active") ?? "keep") as "keep" | "active" | "hidden",
        });
        setMessage(result.error ?? `Updated ${result.count ?? 0} products.`);
        router.refresh();
      }}>
        <strong>Bulk edit {selected.length} selected</strong>
        <div className="grid-2" style={{ marginTop: 8 }}>
          <input className="input" name="stock" placeholder="Set stock" />
          <input className="input" name="discount" placeholder="Set discount %" />
          <select className="input" name="active" defaultValue="keep">
            <option value="keep">Keep visibility</option>
            <option value="active">Show in store</option>
            <option value="hidden">Hide from store</option>
          </select>
          <button className="btn" type="submit">Apply</button>
        </div>
      </form>
      <table>
        <thead>
          <tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td><input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggle(product.id)} /></td>
              <td>{product.name}{product.active ? "" : " (hidden)"}<div className="muted">{product.sku}</div></td>
              <td>{product.category}</td>
              <td>{formatINR(sellingPaise(product.pricePaise, product.discountPercent))}</td>
              <td>{product.stock}</td>
              <td>
                <a href={`/admin/${storeId}/products/${product.id}`}>Edit</a>
                {role === "OWNER" && (
                  <button className="btn-ghost" type="button" style={{ marginLeft: 8 }} onClick={async () => {
                    if (!confirm(`Delete ${product.name}?`)) return;
                    const result = await deleteProduct(storeId, product.id);
                    setMessage(result.error ?? "Deleted.");
                    router.refresh();
                  }}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
