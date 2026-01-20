import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TSIS.ai - SmallCaps Trading Intelligence",
  description: "Advanced analytics, strategies, and performance tracking for small cap traders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
