"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Onboarding from "@/features/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function check() {
      // getSession reads from local cookie/storage — reliable right after sign-up
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/sign-in");
        return;
      }

      // Check if the user already has a profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        // Already onboarded — go to dashboard
        router.replace("/");
        return;
      }

      // No profile yet — show onboarding form
      setReady(true);
    }

    check();
  }, [router]);

  if (!ready) return null;

  return <Onboarding />;
}
