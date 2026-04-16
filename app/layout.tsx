import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diligent Learning Hub",
  description:
    "Explore educational courses, ready-to-use templates, and videos to develop your expertise and enhance board effectiveness across key governance, risk, and compliance topics.",
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
