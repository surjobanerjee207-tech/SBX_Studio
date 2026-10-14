import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Inter_Tight } from "next/font/google";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--f-display",
  display: "swap",
});

const sansFont = Inter_Tight({
  subsets: ["latin"],
  variable: "--f-sans",
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
    <html lang="en" className={`${displayFont.variable} ${sansFont.variable}`}>
      <body className="font-sans">
        <div className="grain" aria-hidden />
        <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 py-4 backdrop-blur bg-ink/70">
          <Link href="/" className="font-semibold flex items-center gap-2.5 group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              <rect width="64" height="64" rx="14" fill="#080808" />
              <path
                d="M14 26V14h12M38 14h12v12M50 38v12H38M26 50H14V38"
                fill="none"
                stroke="#F5F5F5"
                strokeWidth="5"
                strokeLinecap="square"
              />
              <circle cx="32" cy="32" r="8" fill="#E50914" />
            </svg>
            <span>SBX_Studio</span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-5 text-sm text-mute">
            <Link href="/" className="hover:text-bone hidden sm:block">
              Home
            </Link>
            <Link href="/#work" className="hover:text-bone">
              Work
            </Link>
            <Link
              href="/admin"
              className="hover:text-bone text-xs border border-white/20 px-2.5 py-1 text-mute hover:border-bone transition-colors"
            >
              Studio ⚙
            </Link>
            <Link
              href="/contact"
              className="bg-red text-bone px-4 py-2 hover:bg-cherry transition-colors"
            >
              Let&apos;s Work Together
            </Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="px-6 py-12 text-mute text-sm border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-bone font-display text-2xl flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                className="w-6 h-6 shrink-0"
                aria-hidden="true"
              >
                <rect width="64" height="64" rx="14" fill="#080808" />
                <path
                  d="M14 26V14h12M38 14h12v12M50 38v12H38M26 50H14V38"
                  fill="none"
                  stroke="#F5F5F5"
                  strokeWidth="5"
                  strokeLinecap="square"
                />
                <circle cx="32" cy="32" r="8" fill="#E50914" />
              </svg>
              <span>SBX_Studio</span>
            </p>
            <p className="mt-1">Crafting Stories, Frame by Frame.</p>
          </div>
          <div className="text-right sm:text-right">
            <p>© {new Date().getFullYear()} SBX_Studio</p>
            <Link
              href="/admin"
              className="text-xs text-mute/70 hover:text-bone underline underline-offset-4 mt-1 inline-block"
            >
              Manage Portfolio (Studio)
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
