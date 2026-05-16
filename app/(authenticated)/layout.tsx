// Auth + onboarding routing is enforced by middleware before this renders.
  // This layout only provides the UI shell and data providers.
  // force-dynamic prevents useSearchParams() prerender errors in any child page.
  export const dynamic = 'force-dynamic';

  import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
  import { SupabaseDataProvider } from "@/lib/supabase/data-provider";
  import { UserProfileProvider } from "@/context/user-profile-context";

  export default function Layout({ children }: { children: React.ReactNode }) {
    return (
      <UserProfileProvider>
        <SupabaseDataProvider>
          <AuthenticatedLayout>{children}</AuthenticatedLayout>
        </SupabaseDataProvider>
      </UserProfileProvider>
    );
  }
  