import Link from "next/link";
import { logoutAction } from "@/server/auth-actions";

export async function PlatformHeader({ email }: { email?: string | null }) {
  return (
    <header className="wrap topbar">
      <Link href="/" className="brand">
        <strong>Launchyard</strong>
        <span>stores without code</span>
      </Link>
      <nav className="nav">
        {email ? (
          <>
            <Link href="/app">My stores</Link>
            <span className="muted">{email}</span>
            <form action={logoutAction}>
              <button className="btn-ghost" type="submit">Log out</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="btn">Start a store</Link>
          </>
        )}
      </nav>
    </header>
  );
}
