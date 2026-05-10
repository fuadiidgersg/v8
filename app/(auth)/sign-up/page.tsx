"use client";
export const dynamic = 'force-dynamic';
import { Suspense } from "react";
import { SignUp } from "@/features/auth/sign-up";
export default function SignUpPage() { return <Suspense><SignUp /></Suspense>; }
