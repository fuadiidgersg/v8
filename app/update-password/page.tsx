"use client";
export const dynamic = 'force-dynamic';
import { Suspense } from "react";
import { UpdatePassword } from "@/features/auth/update-password";
export default function UpdatePasswordPage() {
  return <Suspense><UpdatePassword /></Suspense>;
}
