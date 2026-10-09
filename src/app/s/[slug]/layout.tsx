import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTheme } from "@/lib/themes";
import { CartProvider } from "@/components/cart";
import { StoreHeader } from "@/components/store-header";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    include: { categories: { orderBy: { name: "asc" } }, sections: true },
  });
  if (!store) notFound();
  const theme = getTheme(store.themeId);
  const showCategories = store.sections.find((section) => section.kind === "categories")?.enabled !== false;
  return (
    <div className="storefront" data-theme={theme.id} data-layout={theme.layout}>
      <CartProvider slug={slug}>
        {store.announcement && <div className="announce">{store.announcement}</div>}
        <StoreHeader
          slug={store.slug}
          name={store.name}
          logo={store.logoData}
          categories={showCategories ? store.categories.map((category) => ({ slug: category.slug, name: category.name })) : []}
        />
        <main className="store-main" style={{ paddingBottom: "3rem" }}>{children}</main>
        <footer className="store-footer" style={{ padding: "1.5rem 0 2rem", borderTop: "1px solid var(--shop-line)" }}>
          <strong>{store.name}</strong>
          <p>{store.footerNote || `${store.addressLine}, ${store.city} ${store.pincode}`}</p>
          <p>{store.phone} · {store.email}{store.whatsapp ? ` · WhatsApp ${store.whatsapp}` : ""}</p>
          <Link href="/">Powered by Launchyard</Link>
        </footer>
      </CartProvider>
    </div>
  );
}
