"use client";
export const dynamic = 'force-dynamic';
import { Suspense } from "react";
import { ForgotPassword } from "@/features/auth/forgot-password";
export default function ForgotPasswordPage() { return <Suspense><ForgotPassword /></Suspense>; }
