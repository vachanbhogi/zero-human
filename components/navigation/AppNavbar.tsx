"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND, CTA, DISCOUNT } from "@/lib/brand";
import { TackMark } from "@/app/components/icons";
import { signOut } from "@/app/auth/actions";

export interface AppNavbarProps {
  userEmail?: string | null;
  isPaid?: boolean;
  activeBusinessName?: string | null;
}

export function AppNavbar({
  userEmail,
  isPaid = false,
  activeBusinessName,
}: AppNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navLinks = isHome
    ? [
        { label: "Pipeline", href: "#pipeline" },
        { label: "Deliverables", href: "#deliverables" },
        { label: "Terac Loop", href: "#terac" },
        { label: "Pricing", href: "#pricing" },
        { label: "FAQ", href: "#faq" },
      ]
    : [
        { label: "Overview", href: "/" },
        { label: "How It Works", href: "/#pipeline" },
        { label: "Pricing", href: "/#pricing" },
      ];

  const userInitial = userEmail
    ? userEmail.charAt(0).toUpperCase()
    : null;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
          scrolled || mobileMenuOpen
            ? "border-b border-white/8 bg-[#08090a]/85 backdrop-blur-xl shadow-lg shadow-black/40"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-300 items-center justify-between gap-4 px-5 md:px-8">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <Link
              href={userEmail && isPaid ? "/dashboard" : "/"}
              className="group flex shrink-0 items-center gap-2.5 text-white"
              aria-label={`${BRAND} Home`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/6 border border-white/10 transition-colors group-hover:border-white/20 group-hover:bg-white/10">
                <TackMark className="h-4 w-4" />
              </div>
              <span className="text-[15px] font-[510] tracking-[-0.01em]">
                {BRAND}
              </span>
            </Link>

            {activeBusinessName ? (
              <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-2.5 py-0.5 text-[11px] font-medium text-[#c7cad1]">
                <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
                {activeBusinessName}
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/3 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em] text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-live" />
                Autonomous Desk
              </span>
            )}
          </div>

          {/* Desktop Nav */}
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary navigation"
          >
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-[13px] text-[#b4bcd0] transition-colors hover:bg-white/4 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2 sm:flex">
            {userEmail ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-1.5 text-[13px] text-[#b4bcd0] transition-colors hover:bg-white/4 hover:text-white"
                >
                  Desk
                </Link>

                <Link
                  href="/onboarding"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/12 bg-white/4 px-3 text-[13px] font-medium text-white transition-colors hover:bg-white/8"
                >
                  <span>+</span> New Sprint
                </Link>

                <div className="flex items-center gap-2 pl-1.5">
                  <div
                    title={userEmail}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/20 border border-brand/35 text-[11px] font-medium text-accent"
                  >
                    {userInitial}
                  </div>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="rounded-md px-2 py-1 text-[12px] text-tertiary transition-colors hover:text-white"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/?modal=login&redirectTo=%2Fdashboard"
                  className="rounded-md px-3 py-1.5 text-[13px] text-[#b4bcd0] transition-colors hover:bg-white/4 hover:text-white"
                >
                  Log in
                </Link>

                <Link
                  href="/onboarding"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3.5 text-[13px] font-medium text-[#08090a] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]"
                >
                  {CTA}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            {!userEmail && (
              <Link
                href="/onboarding"
                className="inline-flex h-7.5 items-center rounded-md bg-white px-2.5 text-[12px] font-medium text-[#08090a]"
              >
                Start
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/4 text-white transition-colors hover:bg-white/8"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col bg-[#08090a]/95 backdrop-blur-2xl px-6 py-8 md:hidden">
          <nav className="flex flex-col space-y-4" aria-label="Mobile navigation">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-[17px] font-medium text-[#c7cad1] transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 border-t border-white/10 pt-6">
            {userEmail ? (
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2 pb-2 text-[14px] text-secondary">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 text-accent font-medium text-[11px]">
                    {userInitial}
                  </span>
                  <span className="truncate">{userEmail}</span>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center rounded-lg bg-white/10 text-[15px] font-medium text-white"
                >
                  Open Growth Desk
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center rounded-lg bg-white text-[15px] font-medium text-[#08090a]"
                >
                  + Start New Sprint
                </Link>
                <form action={signOut} className="pt-2">
                  <button
                    type="submit"
                    className="w-full text-center text-[14px] text-tertiary hover:text-white"
                  >
                    Log out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center rounded-lg bg-white text-[15px] font-medium text-[#08090a]"
                >
                  {CTA} ({DISCOUNT})
                </Link>
                <Link
                  href="/?modal=login&redirectTo=%2Fdashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center rounded-lg border border-white/12 bg-white/4 text-[15px] font-medium text-white"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
