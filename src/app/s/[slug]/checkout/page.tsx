import { CheckoutForm } from "@/components/store-widgets";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div style={{ maxWidth: 560 }}>
      <h1>Checkout</h1>
      <CheckoutForm slug={slug} />
    </div>
  );
}
