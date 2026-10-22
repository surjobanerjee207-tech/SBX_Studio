import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Inter_Tight, Manrope } from "next/font/google";
import { PublicChrome } from "@/components/PublicChrome";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--f-display",
  display: "swap",
});

const sansFont = Inter_Tight({
  subsets: ["latin"],
  variable: "--f-sans",
});

const priceFont = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-price",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "SBX_Studio | Video Editing & Visual Storytelling",
  description:
    "Explore cinematic video editing, promotional films, and creative storytelling by SBX_Studio.",
  openGraph: {
    title: "SBX_Studio",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${sansFont.variable} ${priceFont.variable}`}>
      <body className="font-sans">
        <div className="grain" aria-hidden />
        <PublicChrome>{children}</PublicChrome>
      </body>
    </html>
  );
}
