import { PlatformHeader } from "@/components/platform-header";
import { AuthForm } from "@/components/auth-form";
import { currentUser } from "@/server/auth-actions";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const user = await currentUser();
  if (user) redirect("/onboarding");
  return (
    <>
      <PlatformHeader />
      <AuthForm mode="signup" />
    </>
  );
}
