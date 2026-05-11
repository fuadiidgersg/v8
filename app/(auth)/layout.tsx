"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Not authenticated — show auth page
        setReady(true);
        return;
      }

      // Authenticated — check if onboarding complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      // Redirect away from auth pages
      router.replace(profile ? "/" : "/onboarding");
    }

    check();
  }, [router]);

  if (!ready) return null;

  return <>{children}</>;
}
