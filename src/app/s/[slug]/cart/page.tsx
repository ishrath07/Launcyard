import { CartView } from "@/components/store-widgets";

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div>
      <h1>Cart</h1>
      <CartView slug={slug} />
    </div>
  );
}
