import Link from "next/link";

const LINKS = [
  ["Overview", ""],
  ["Products", "/products"],
  ["Orders", "/orders"],
  ["Import", "/import"],
  ["Content", "/content"],
  ["Theme", "/theme"],
  ["Team", "/team"],
  ["Assistant", "/assistant"],
];

export function AdminShell({
  storeId,
  storeName,
  slug,
  role,
  current,
  children,
}: {
  storeId: string;
  storeName: string;
  slug: string;
  role: string;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="wrap admin">
      <aside className="side">
        <p className="kicker">{role}</p>
        <strong>{storeName}</strong>
        <nav style={{ marginTop: 10 }}>
          {LINKS.map(([label, href]) => {
            const path = `/admin/${storeId}${href}`;
            const active = current === href;
            return <Link key={href} className={active ? "active" : ""} href={path}>{label}</Link>;
          })}
          <Link href={`/s/${slug}`}>View store</Link>
          <Link href="/app">All stores</Link>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}

export function OwnerNote() {
  return <p className="error">Only the store owner can use this section. Staff can manage products, imports, and orders.</p>;
}
