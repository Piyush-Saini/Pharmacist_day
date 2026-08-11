import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Pharmacist Wrapped 2026 — Mankind Pharma",
  description:
    "Six short questions and one photo. We turn your working life into a film you can keep.",
  // A pharmacist's finished film sits behind an unguessable link, not a login;
  // keeping the whole portal out of search indexes is part of that model.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom stays enabled: the audience includes people who need it.
  maximumScale: 5,
  themeColor: "#0E4C92",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
