import Link from "next/link";
import { cookies } from "next/headers";
import { BRAND, CTA } from "@/lib/brand";
import { TackMark } from "../icons";
import { AuthLinks } from "@/components/auth/AuthLinks";
import { createClient } from "@/utils/supabase/server";

const nav = [
  { label: "Desk", href: "#pipeline" },
  { label: "Loop", href: "#terac" },
  { label: "Deliverable", href: "#report" },
];

export async function Header() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-300 items-center justify-between gap-4 px-5 md:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-white"
          aria-label={BRAND}
        >
          <TackMark className="h-4.5 w-4.5" />
          <span className="text-[15px] font-[510] tracking-[-0.01em]">{BRAND}</span>
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-1">
          <nav className="mr-1 hidden items-center sm:flex" aria-label="Primary">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="inline-flex items-center px-2.5 py-1.5 text-[13px] text-[#b4bcd0] transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mx-1.5 hidden h-4 w-px shrink-0 bg-white/10 sm:block" />

          <div className="flex shrink-0 items-center gap-1">
            <AuthLinks />
          </div>

          <Link
            href={user ? "/dashboard" : "/onboarding"}
            className="ml-1 inline-flex h-8 items-center rounded-lg bg-white px-3 text-[13px] font-medium text-[#08090a] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]"
          >
            {user ? "Open desk" : CTA}
          </Link>
        </div>
      </div>
    </header>
  );
}
