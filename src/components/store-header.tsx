"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart";

export function StoreHeader({
  slug,
  name,
  logo,
  categories,
}: {
  slug: string;
  name: string;
  logo: string;
  categories: { slug: string; name: string }[];
}) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="store-header">
        <Link href={`/s/${slug}`} style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none" }}>
          {logo ? <img src={logo} alt="" style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 8 }} /> : null}
          <strong className="display" style={{ fontSize: "1.4rem" }}>{name}</strong>
        </Link>
        <form className="store-search" action={`/s/${slug}/search`}>
          <input name="q" placeholder="Search products" aria-label="Search products" />
          <button className="shop-btn" type="submit">Search</button>
        </form>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="menu-btn" type="button" onClick={() => setOpen((value) => !value)}>Menu</button>
          <Link className="ghost-shop" href={`/s/${slug}/cart`}>Cart ({cart.count})</Link>
        </div>
      </header>
      <div className="store-main">
        <nav className={open ? "mobile-cats open" : "cat-row"}>
          {categories.map((category) => (
            <Link key={category.slug} href={`/s/${slug}/c/${category.slug}`}>{category.name}</Link>
          ))}
        </nav>
      </div>
    </>
  );
}

export function FilterBar({ action }: { action: string }) {
  return (
    <form className="filters" action={action}>
      <input name="q" placeholder="Search in this list" aria-label="Search" />
      <input name="min" type="number" min={0} placeholder="Min ₹" aria-label="Minimum price" />
      <input name="max" type="number" min={0} placeholder="Max ₹" aria-label="Maximum price" />
      <select name="sort" defaultValue="new" aria-label="Sort">
        <option value="new">Newest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="checkbox" name="stock" value="1" /> In stock
      </label>
      <button className="shop-btn" type="submit">Apply</button>
    </form>
  );
}
