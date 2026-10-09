"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  clearSessionCookie,
  getSession,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

const credentials = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80).optional(),
  email: z.string().trim().email("Enter a valid email.").max(120),
  password: z.string().min(8, "Use at least 8 characters."),
});

export async function signupAction(_prev: { error?: string } | null, formData: FormData) {
  const parsed = credentials.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists. Log in instead." };
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name?.trim() || email.split("@")[0],
      email,
      passwordHash: hashPassword(parsed.data.password),
    },
  });
  await setSessionCookie(user.id);
  redirect("/onboarding");
}

export async function loginAction(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "That email and password do not match." };
  }
  await setSessionCookie(user.id);
  redirect(next.startsWith("/") ? next : "/app");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function currentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}
