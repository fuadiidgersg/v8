import type { Metadata } from "next";
import { Providers } from "./providers";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: "FuadFX Journal",
  description: "Forex trading journal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
