import type { Metadata } from "next";
import "./globals.css";
import "./landing-v2-showcase-fix.css";

export const metadata: Metadata = {
  title: "FanMind",
  description: "KI-CRM für Creator, Clubs, Events und Fan-Communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
