import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mechanic IQ",
  description: "AI-powered mechanic diagnosis game",
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