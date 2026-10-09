import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth-actions";
import { PlatformHeader } from "@/components/platform-header";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/signup");
  return (
    <>
      <PlatformHeader email={user.email} />
      <OnboardingWizard />
    </>
  );
}
