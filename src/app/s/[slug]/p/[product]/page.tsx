import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatINR, sellingPaise } from "@/lib/money";
import { AddToCart, ProductImage } from "@/components/store-widgets";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; product: string }> }) {
  const { slug, product: productSlug } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();
  const product = await prisma.product.findUnique({
    where: { storeId_slug: { storeId: store.id, slug: productSlug } },
    include: { variants: true, category: true },
  });
  if (!product || !product.active) notFound();
  const price = sellingPaise(product.pricePaise, product.discountPercent);
  return (
    <article style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "1.2rem" }} className="product-page">
      <ProductImage src={product.imageUrl} alt={product.name} />
      <div>
        {product.category && <p>{product.category.name}</p>}
        <h1 style={{ marginTop: 0 }}>{product.name}</h1>
        <p className="price" style={{ fontSize: "1.4rem" }}>
          {product.compareAtPaise && product.compareAtPaise > price ? <span className="was">{formatINR(product.compareAtPaise)}</span> : null}
          {formatINR(price)}
        </p>
        <p>{product.description}</p>
        {product.sku && <p>SKU {product.sku}</p>}
        <AddToCart product={product} />
      </div>
    </article>
  );
}
