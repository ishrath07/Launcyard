import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE = "launchyard_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return value;
}

export type Session = { userId: string; exp: number };

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export function signSession(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + MAX_AGE_MS } satisfies Session),
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!session.userId || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession() {
  const jar = await cookies();
  return readToken(jar.get(COOKIE)?.value);
}
