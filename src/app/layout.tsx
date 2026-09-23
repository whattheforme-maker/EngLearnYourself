import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Learn Yourself — Shaxsiy lug'at va mini-o'yinlar",
  description:
    "LinDuo English uslubidagi shaxsiy lug'at: vizual kartochkalar, audio talaffuz va 4 xil mini-o'yin orqali so'z yodlash.",
};

export const viewport: Viewport = {
  themeColor: "#0b0a24",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-night antialiased">{children}</body>
    </html>
  );
}
