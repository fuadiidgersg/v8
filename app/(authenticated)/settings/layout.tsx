"use client";

export const dynamic = 'force-dynamic';
import { Settings } from "@/features/settings";
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Settings>{children}</Settings>;
}
