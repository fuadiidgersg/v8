import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do not add any logic between createServerClient and getUser
  // that might interrupt cookie forwarding.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Public routes that never require authentication
  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/otp") ||
    pathname.startsWith("/update-password") ||
    pathname.startsWith("/auth/callback");

  const isOnboarding = pathname === "/onboarding";
  const isApiRoute = pathname.startsWith("/api/");

  // API routes return 401 via getAuthenticatedUser() — don't redirect here
  if (isApiRoute) return supabaseResponse;

  // No session → send to sign-in (except auth/public routes)
  if (!user && !isAuthRoute && !isOnboarding) {
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Has session on a protected page — ensure onboarding is complete
  if (user && !isAuthRoute && !isOnboarding) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // Has session on an auth page → redirect away
  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    url.pathname = profile ? "/" : "/onboarding";
    return NextResponse.redirect(url);
  }

  // Has session on onboarding but already has profile → send to dashboard
  if (user && isOnboarding) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profile) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
