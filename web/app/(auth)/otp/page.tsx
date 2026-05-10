"use client";
export const dynamic = 'force-dynamic';
import { Suspense } from "react";
import { Otp } from "@/features/auth/otp";
export default function OtpPage() { return <Suspense><Otp /></Suspense>; }
