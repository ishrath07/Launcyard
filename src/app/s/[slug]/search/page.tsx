import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FilterBar } from "@/components/store-header";
import { ProductCard } from "@/components/store-widgets";
import { applyCatalogFilters } from "@/lib/shop";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; min?: string; max?: string; stock?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();
  const products = await prisma.product.findMany({ where: { storeId: store.id, active: true } });
  const visible = applyCatalogFilters(products, query);
  return (
    <div>
      <h1>Search{query.q ? `: ${query.q}` : ""}</h1>
      <FilterBar action={`/s/${slug}/search`} />
      <div className="product-grid">
        {visible.map((product) => <ProductCard key={product.id} slug={slug} product={product} />)}
      </div>
      {!visible.length && <p>No products match.</p>}
    </div>
  );
}
