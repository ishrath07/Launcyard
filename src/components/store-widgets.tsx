"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR, sellingPaise } from "@/lib/money";
import { useCart } from "@/components/cart";

export function ProductCard({
  slug,
  product,
}: {
  slug: string;
  product: {
    slug: string;
    name: string;
    imageUrl: string;
    pricePaise: number;
    compareAtPaise: number | null;
    discountPercent: number;
    stock: number;
  };
}) {
  const price = sellingPaise(product.pricePaise, product.discountPercent);
  return (
    <Link className="product-card" href={`/s/${slug}/p/${product.slug}`}>
      <ProductImage src={product.imageUrl} alt={product.name} />
      <div>
        <strong>{product.name}</strong>
        <div className="price">
          {product.compareAtPaise && product.compareAtPaise > price ? <span className="was">{formatINR(product.compareAtPaise)}</span> : null}
          {formatINR(price)}
          {product.discountPercent > 0 ? ` · ${product.discountPercent}% off` : ""}
        </div>
        <div>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</div>
      </div>
    </Link>
  );
}

export function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="ph" aria-label={alt} />;
  return <img src={src} alt={alt} onError={() => setFailed(true)} />;
}

export function AddToCart({
  product,
}: {
  product: {
    id: string;
    name: string;
    pricePaise: number;
    discountPercent: number;
    imageUrl: string;
    stock: number;
    variants: { id: string; name: string; stock: number; pricePaise: number | null }[];
  };
}) {
  const cart = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const variant = product.variants.find((item) => item.id === variantId);
  const available = variant ? variant.stock : product.stock;
  const price = sellingPaise(variant?.pricePaise ?? product.pricePaise, product.discountPercent);

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      if (available < 1) return setNote("This is out of stock.");
      cart.add({
        productId: product.id,
        variantId: variant?.id,
        name: variant ? `${product.name} (${variant.name})` : product.name,
        pricePaise: price,
        qty,
        imageUrl: product.imageUrl,
      });
      setNote("Added to cart.");
    }}>
      {!!product.variants.length && (
        <label className="field">
          <span>Option</span>
          <select className="text-input" value={variantId} onChange={(event) => setVariantId(event.target.value)}>
            {product.variants.map((item) => (
              <option key={item.id} value={item.id}>{item.name} · {item.stock} left</option>
            ))}
          </select>
        </label>
      )}
      <label className="field">
        <span>Quantity · {available} in stock</span>
        <input className="text-input" type="number" min={1} max={Math.max(1, available)} value={qty} onChange={(event) => setQty(Number(event.target.value))} />
      </label>
      <button className="shop-btn" type="submit" disabled={available < 1}>Add to cart · {formatINR(price)}</button>
      {note && <p>{note}</p>}
    </form>
  );
}

export function CartView({ slug }: { slug: string }) {
  const cart = useCart();
  const total = cart.lines.reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
  if (!cart.lines.length) return <p>Your cart is empty. <Link href={`/s/${slug}`}>Continue shopping</Link></p>;
  return (
    <div>
      {cart.lines.map((line) => (
        <div key={`${line.productId}-${line.variantId ?? ""}`} style={{ display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 12, marginBottom: 12 }}>
          <ProductImage src={line.imageUrl} alt="" />
          <div>
            <strong>{line.name}</strong>
            <div>{formatINR(line.pricePaise)}</div>
            <input type="number" min={1} max={20} value={line.qty} onChange={(event) => cart.setQty(`${line.productId}:${line.variantId ?? ""}`, Number(event.target.value))} />
          </div>
          <button className="ghost-shop" type="button" onClick={() => cart.setQty(`${line.productId}:${line.variantId ?? ""}`, 0)}>Remove</button>
        </div>
      ))}
      <p className="price">Total {formatINR(total)}</p>
      <p className="muted">The store confirms the price and stock at checkout.</p>
      <Link className="shop-btn" href={`/s/${slug}/checkout`}>Checkout</Link>
    </div>
  );
}

export function CheckoutForm({ slug }: { slug: string }) {
  const cart = useCart();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const total = cart.lines.reduce((sum, line) => sum + line.pricePaise * line.qty, 0);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const { placeOrder } = await import("@/server/order-actions");
    const result = await placeOrder({
      slug,
      customerName: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      address: String(data.get("address") ?? ""),
      items: cart.lines.map((line) => ({ productId: line.productId, variantId: line.variantId, qty: line.qty })),
    });
    setPending(false);
    if (result.error || !result.orderId) {
      setError(result.error ?? "Could not place the order.");
      return;
    }
    cart.clear();
    router.push(`/s/${slug}/order/${result.orderId}`);
  }

  if (!cart.lines.length) return <p>Your cart is empty.</p>;
  return (
    <form onSubmit={onSubmit}>
      {error && <p className="error">{error}</p>}
      <p>Cart total {formatINR(total)}. Final amount is calculated from the store catalog.</p>
      <label className="field"><span>Name</span><input className="text-input" name="name" required /></label>
      <label className="field"><span>Email</span><input className="text-input" name="email" type="email" required /></label>
      <label className="field"><span>Phone</span><input className="text-input" name="phone" required /></label>
      <label className="field"><span>Delivery address</span><textarea className="text-input" name="address" required /></label>
      <button className="shop-btn" disabled={pending} type="submit">{pending ? "Placing order…" : "Place order"}</button>
    </form>
  );
}
