import { type NextRequest, NextResponse } from "next/server";

// Auth guards are handled client-side in app/(authenticated)/layout.tsx
// and app/onboarding/page.tsx using the Supabase browser client.
// This middleware is intentionally minimal — it only refreshes the session
// cookie so the server-side Supabase client stays in sync.
export async function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
