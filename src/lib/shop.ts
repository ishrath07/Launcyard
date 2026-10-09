import { sellingPaise } from "@/lib/money";

export type CatalogQuery = { q?: string; min?: string; max?: string; stock?: string; sort?: string };

export function applyCatalogFilters<T extends {
  name: string;
  description: string;
  pricePaise: number;
  discountPercent: number;
  stock: number;
  createdAt: Date;
}>(products: T[], query: CatalogQuery) {
  const q = (query.q ?? "").trim().toLowerCase();
  const min = query.min ? Number(query.min) * 100 : null;
  const max = query.max ? Number(query.max) * 100 : null;
  let list = products.filter((product) => {
    const price = sellingPaise(product.pricePaise, product.discountPercent);
    if (q && !`${product.name} ${product.description}`.toLowerCase().includes(q)) return false;
    if (min !== null && Number.isFinite(min) && price < min) return false;
    if (max !== null && Number.isFinite(max) && price > max) return false;
    if (query.stock === "1" && product.stock < 1) return false;
    return true;
  });
  if (query.sort === "price_asc") {
    list = [...list].sort((a, b) => sellingPaise(a.pricePaise, a.discountPercent) - sellingPaise(b.pricePaise, b.discountPercent));
  } else if (query.sort === "price_desc") {
    list = [...list].sort((a, b) => sellingPaise(b.pricePaise, b.discountPercent) - sellingPaise(a.pricePaise, a.discountPercent));
  } else {
    list = [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return list;
}
