import { PlatformHeader } from "@/components/platform-header";
import { AuthForm } from "@/components/auth-form";
import { currentUser } from "@/server/auth-actions";
import { redirect } from "next/navigation";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await currentUser();
  const query = await searchParams;
  if (user) redirect(query.next || "/app");
  return (
    <>
      <PlatformHeader />
      <AuthForm mode="login" next={query.next} />
    </>
  );
}
