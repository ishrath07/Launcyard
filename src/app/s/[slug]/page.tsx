import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/store-widgets";

export default async function StoreHome({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      sections: { orderBy: { sort: "asc" } },
      categories: true,
      products: { where: { active: true }, include: { category: true }, orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!store) notFound();
  const hero = store.sections.find((section) => section.kind === "hero" && section.enabled);
  const about = store.sections.find((section) => section.kind === "about" && section.enabled);
  const showFeatured = store.sections.find((section) => section.kind === "featured")?.enabled !== false;
  return (
    <div>
      {query.welcome && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <strong>Your store is live.</strong>
          <p>Share this address: <code>/s/{store.slug}</code></p>
          <p>Manage it from the admin desk. Shoppers can search, filter, and check out right now.</p>
        </div>
      )}
      <section className="hero-shop">
        <div>
          <h1 style={{ margin: 0, fontSize: "clamp(2.2rem, 5vw, 4rem)" }}>{hero?.title || store.bannerTitle || store.name}</h1>
          <p>{hero?.body || store.bannerSubtitle}</p>
        </div>
      </section>
      {showFeatured && (
        <>
          <h2>{store.sections.find((section) => section.kind === "featured")?.title || "Just in"}</h2>
          <div className="product-grid">
            {store.products.map((product) => <ProductCard key={product.id} slug={slug} product={product} />)}
          </div>
          {!store.products.length && <p>The shelves are empty. Add products from the admin desk.</p>}
        </>
      )}
      {about && (
        <section style={{ marginTop: 24 }}>
          <h2>{about.title || `About ${store.name}`}</h2>
          <p>{about.body || store.aboutText}</p>
        </section>
      )}
    </div>
  );
}
