"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  productId: string;
  variantId?: string;
  name: string;
  pricePaise: number;
  qty: number;
  imageUrl: string;
};

type CartApi = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  count: number;
};

const CartContext = createContext<CartApi | null>(null);

function keyOf(line: { productId: string; variantId?: string }) {
  return `${line.productId}:${line.variantId ?? ""}`;
}

export function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const storageKey = `launchyard_cart_${slug}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { setLines(JSON.parse(saved) as CartLine[]); } catch { setLines([]); }
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(lines));
  }, [lines, storageKey]);

  const api = useMemo<CartApi>(() => ({
    lines,
    count: lines.reduce((sum, line) => sum + line.qty, 0),
    add: (line) => {
      setLines((current) => {
        const key = keyOf(line);
        const existing = current.find((item) => keyOf(item) === key);
        if (!existing) return [...current, line];
        return current.map((item) => keyOf(item) === key ? { ...item, qty: Math.min(20, item.qty + line.qty) } : item);
      });
    },
    setQty: (key, qty) => setLines((current) => current.flatMap((item) => {
      if (keyOf(item) !== key) return [item];
      if (qty < 1) return [];
      return [{ ...item, qty }];
    })),
    clear: () => setLines([]),
  }), [lines]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("Cart is only available inside a store.");
  return cart;
}

export function cartKey(line: { productId: string; variantId?: string }) {
  return keyOf(line);
}
