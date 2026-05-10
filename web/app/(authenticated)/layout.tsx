"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { SupabaseDataProvider } from "@/lib/supabase/data-provider";

export default function AuthGuardLayout({
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
        router.replace("/sign-in");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (!profile) {
        router.replace("/onboarding");
        return;
      }

      setReady(true);
    }

    check();
  }, [router]);

  if (!ready) return null;

  return (
    <SupabaseDataProvider>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </SupabaseDataProvider>
  );
}
