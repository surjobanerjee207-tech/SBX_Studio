"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");
  const isInvoicePublic = pathname.startsWith("/i/");

  // Close mobile menu whenever navigating to a new route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // On any /admin route or standalone public invoice route, do NOT render public header or footer
  if (isAdmin || isInvoicePublic) {
    return <>{children}</>;
  }

  const isHome = pathname === "/";
  const isWork = pathname === "/#work" || pathname.startsWith("/work");
  const isPricing = pathname === "/pricing";

  const navLinks = [
    { name: "Home", href: "/", active: isHome },
    { name: "Work", href: "/#work", active: isWork },
    { name: "Pricing", href: "/pricing", active: isPricing },
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur bg-ink/80 border-b border-white/5">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold">
            <img src="/icon.svg" alt="" width={28} height={28} className="h-7 w-7" />
            SBX_Studio
          </Link>

          <nav aria-label="Main" className="flex items-center gap-3 sm:gap-6 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`hidden md:inline transition-colors ${
                  link.active ? "text-bone font-medium" : "text-mute hover:text-bone"
                }`}
              >
                {link.name}
              </Link>
            ))}

            <Link
              href="/contact"
              className="shrink-0 whitespace-nowrap bg-red px-3 py-2 text-bone transition-colors hover:bg-cherry sm:px-4"
            >
              <span className="sm:hidden">Let&apos;s Talk</span>
              <span className="hidden sm:inline">Let&apos;s Work Together</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-mute hover:text-bone focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-ink/95 backdrop-blur-xl px-5 py-4 space-y-3">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base transition-colors py-1 ${
                    link.active ? "text-bone font-semibold" : "text-mute hover:text-bone"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t border-white/10">
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center bg-red hover:bg-cherry text-bone px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Let&apos;s Work Together
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 px-6 py-12 text-mute text-sm border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-bone font-display text-2xl flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              className="w-6 h-6 shrink-0"
              aria-hidden="true"
            >
              <rect width="64" height="64" rx="14" fill="#080808" />
              <rect x="10" y="13" width="18" height="10" rx="2" fill="#3a3a3a" />
              <rect x="32" y="13" width="22" height="10" rx="2" fill="#3a3a3a" />
              <rect x="10" y="27" width="28" height="10" rx="2" fill="#E50914" />
              <rect x="42" y="27" width="12" height="10" rx="2" fill="#3a3a3a" />
              <rect x="10" y="41" width="14" height="10" rx="2" fill="#3a3a3a" />
              <rect x="28" y="41" width="26" height="10" rx="2" fill="#3a3a3a" />
              <rect x="34" y="7" width="3" height="50" rx="1.5" fill="#F5F5F5" />
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
    </>
  );
}
