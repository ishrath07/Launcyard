import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");
  return user;
}

export async function requireMember(storeId: string) {
  const user = await requireUser();
  const member = await prisma.storeMember.findUnique({
    where: { storeId_userId: { storeId, userId: user.id } },
    include: { store: true, user: true },
  });
  if (!member) redirect("/app");
  return member;
}
