import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { applyCatalogFilters } from "@/lib/shop";
import { FilterBar } from "@/components/store-header";
import { ProductCard } from "@/components/store-widgets";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; category: string }>;
  searchParams: Promise<{ q?: string; min?: string; max?: string; stock?: string; sort?: string }>;
}) {
  const { slug, category: categorySlug } = await params;
  const query = await searchParams;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();
  const category = await prisma.category.findUnique({ where: { storeId_slug: { storeId: store.id, slug: categorySlug } } });
  if (!category) notFound();
  const products = await prisma.product.findMany({
    where: { storeId: store.id, categoryId: category.id, active: true },
  });
  const visible = applyCatalogFilters(products, query);
  return (
    <div>
      <h1>{category.name}</h1>
      <FilterBar action={`/s/${slug}/c/${category.slug}`} />
      <div className="product-grid">
        {visible.map((product) => <ProductCard key={product.id} slug={slug} product={product} />)}
      </div>
      {!visible.length && <p>No products match these filters.</p>}
    </div>
  );
}
