import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AdminApp } from "@/components/admin-app";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Solomon · Admin",
  description: "Lokalni admin panel za Solomon Halcom B2B agent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
