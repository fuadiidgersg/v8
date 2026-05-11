"use client";
// Auth guard handled by middleware — unauthenticated users are redirected to
// /sign-in, and users who already have a profile are redirected to /.
import Onboarding from "@/features/onboarding";
export default function OnboardingPage() {
  return <Onboarding />;
}
