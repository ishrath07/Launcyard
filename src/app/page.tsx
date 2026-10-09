import Link from "next/link";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";

export default async function HomePage() {
  const user = await currentUser();
  return (
    <>
      <PlatformHeader email={user?.email} />
      <main className="wrap">
        <section className="hero-home">
          <div>
            <p className="kicker">Launch-your-store</p>
            <h1 style={{ fontSize: "clamp(2.6rem, 6vw, 4.6rem)", lineHeight: 0.95, margin: "0.4rem 0 1rem" }}>
              Fill a form, pick a theme, get a live online store.
            </h1>
            <p className="muted" style={{ fontSize: "1.15rem", maxWidth: 520 }}>
              A small business owner can open a complete store in minutes: name, logo, categories, products, and a theme. The shop is live on its own address as soon as setup finishes.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.2rem", flexWrap: "wrap" }}>
              <Link className="btn" href={user ? "/onboarding" : "/signup"}>Create a store</Link>
              <Link className="btn-ghost" href={user ? "/app" : "/login"}>I already have an account</Link>
            </div>
          </div>
          <div className="panel">
            <p className="kicker">What you get</p>
            <ol style={{ lineHeight: 1.6, paddingLeft: "1.1rem" }}>
              <li>A step-by-step onboarding form with validation.</li>
              <li>Sample products or a spreadsheet import that flags bad rows.</li>
              <li>Four themes, previewed before you confirm.</li>
              <li>A public shop with search, cart, and checkout.</li>
              <li>An admin desk for stock, orders, and content.</li>
              <li>An owner assistant that reads your store data and shows its working.</li>
            </ol>
          </div>
        </section>
        <section className="steps" style={{ marginBottom: "3rem" }}>
          {[
            ["01", "Tell us the shop", "Name, logo, contact, address, and business type."],
            ["02", "Add the catalog", "Pick categories, then sample products or a sheet."],
            ["03", "Choose the look", "Colors, type, and layout change together."],
            ["04", "Open the doors", "The store URL is live, and the admin desk is ready."],
          ].map(([n, title, body]) => (
            <article key={n} className="panel step-card">
              <div className="kicker">{n}</div>
              <h2 style={{ margin: "0.3rem 0" }}>{title}</h2>
              <p className="muted">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
