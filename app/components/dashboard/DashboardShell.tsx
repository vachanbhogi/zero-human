"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { loadProducts, selectBusiness } from "@/app/dashboard/actions";
import type { OrderResponse } from "@/lib/types";
import type { Business, Product } from "@/lib/workspace-types";
import {
  accountDropdown,
  businessDropdown,
  dropdownItem,
  headerLink,
  headerLogoutButton,
  navItemActive,
  navItemIdle,
} from "@/lib/dashboard-ui";
import { CTA } from "@/lib/brand";
import { BusinessTab } from "./BusinessTab";
import { ProductsTab } from "./ProductsTab";
import { SettingsTab } from "./SettingsTab";
import { SprintsTab } from "./SprintsTab";

export type DashboardTab = "business" | "products" | "sprints" | "settings";

const tabs: { id: DashboardTab; label: string; icon: string }[] = [
  { id: "sprints", label: "Sprints", icon: "chart" },
  { id: "products", label: "Products", icon: "box" },
  { id: "business", label: "Business", icon: "gear" },
];

function isDashboardTab(value: string | null): value is DashboardTab {
  return (
    value === "settings" ||
    (value !== null && tabs.some((tab) => tab.id === value))
  );
}

export function DashboardShell({
  displayName,
  email,
  businesses,
  initialSelectedBusinessId,
  initialProducts,
  sprints,
  initialTab = "sprints",
}: {
  displayName: string;
  email: string;
  businesses: Business[];
  initialSelectedBusinessId: string | null;
  initialProducts: Product[];
  sprints: OrderResponse[];
  initialTab?: DashboardTab;
}) {
  const [active, setActive] = useState<DashboardTab>(initialTab);
  const [deskBusinesses, setDeskBusinesses] = useState(businesses);
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    initialSelectedBusinessId ?? businesses[0]?.id ?? "",
  );
  const [products, setProducts] = useState(initialProducts);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const businessMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [isSelectingBusiness, startSelectBusiness] = useTransition();

  const selectedBusiness =
    deskBusinesses.find((business) => business.id === selectedBusinessId) ??
    deskBusinesses[0];
  const businessInitial = selectedBusiness?.name[0]?.toUpperCase() ?? "B";
  const activeTabLabel =
    active === "settings"
      ? "Settings"
      : (tabs.find((tab) => tab.id === active)?.label ?? "Desk");
  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const visibleSprints = selectedBusiness
    ? sprints.filter((sprint) => sprint.businessId === selectedBusiness.id)
    : sprints;

  useEffect(() => {
    if (!businessMenuOpen && !accountMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (businessMenuOpen && !businessMenuRef.current?.contains(event.target)) {
        setBusinessMenuOpen(false);
      }
      if (accountMenuOpen && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBusinessMenuOpen(false);
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [businessMenuOpen, accountMenuOpen]);

  useEffect(() => {
    const handleHistoryChange = () => {
      const tab = new URL(window.location.href).searchParams.get("tab");
      if (isDashboardTab(tab)) setActive(tab);
    };
    window.addEventListener("popstate", handleHistoryChange);
    return () => window.removeEventListener("popstate", handleHistoryChange);
  }, []);

  const selectTab = (tab: DashboardTab) => {
    setActive(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState(null, "", url);
  };

  const switchBusiness = (id: string) => {
    const previous = selectedBusinessId;
    setSelectedBusinessId(id);
    setBusinessMenuOpen(false);
    setBusinessError(null);
    startSelectBusiness(async () => {
      const result = await selectBusiness(id);
      if (result.error) {
        setSelectedBusinessId(previous);
        setBusinessError(result.error);
        return;
      }
      const loaded = await loadProducts(id);
      if (loaded.error) {
        setBusinessError(loaded.error);
        return;
      }
      setProducts(loaded.products);
    });
  };

  return (
    <div className="relative flex h-dvh flex-col bg-[#08090a] text-foreground md:h-screen md:flex-row">
      <div className="zh-grain pointer-events-none absolute inset-0 z-0 opacity-30" aria-hidden />

      <aside className="relative z-10 flex w-full shrink-0 flex-col border-b border-white/6 bg-[#08090a] md:w-56 md:border-b-0 md:border-r md:border-white/6">
        <div
          className="relative border-b border-white/6 px-3 py-3"
          ref={businessMenuRef}
        >
          <button
            type="button"
            onClick={() => {
              setAccountMenuOpen(false);
              setBusinessMenuOpen((open) => !open);
            }}
            disabled={!selectedBusiness || isSelectingBusiness}
            aria-haspopup="listbox"
            aria-expanded={businessMenuOpen}
            aria-label="Select business"
            className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-[background-color] duration-150 hover:bg-white/4 active:scale-[0.99] disabled:opacity-60"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand text-[11px] font-bold text-white">
              {businessInitial}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-tight text-white">
              {selectedBusiness?.name ?? "No business yet"}
            </span>
            <svg
              className={`h-3.5 w-3.5 shrink-0 text-secondary transition-transform duration-150 ${businessMenuOpen ? "rotate-180" : ""}`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>

          {businessMenuOpen ? (
            <div role="listbox" aria-label="Businesses" className={businessDropdown}>
              {deskBusinesses.map((business) => {
                const isSelected = business.id === selectedBusinessId;
                return (
                  <button
                    key={business.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isSelectingBusiness}
                    onClick={() => switchBusiness(business.id)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-[background-color,color] duration-150 ${
                      isSelected
                        ? "bg-white/8 text-white"
                        : "text-secondary hover:bg-white/4 hover:text-white"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/20 text-[10px] font-semibold text-brand">
                      {business.name[0]?.toUpperCase()}
                    </span>
                    <span className="truncate">{business.name}</span>
                  </button>
                );
              })}
              <div className="my-1 border-t border-white/8" />
              <button
                type="button"
                onClick={() => {
                  setBusinessMenuOpen(false);
                  selectTab("business");
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-secondary transition-colors hover:bg-white/4 hover:text-white"
              >
                Manage businesses
              </button>
            </div>
          ) : null}
        </div>

        <nav
          className="relative flex gap-0.5 overflow-x-auto px-2 py-2 md:flex-1 md:block md:space-y-0.5 md:pt-3"
          aria-label="Desk"
        >
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={`group relative flex w-auto shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] transition-[background-color,color] duration-150 active:scale-[0.98] md:w-full ${
                  isActive ? navItemActive : navItemIdle
                }`}
              >
                <NavIcon name={tab.icon} active={isActive} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="relative flex items-center gap-1.5 px-3 pb-3" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => {
              setBusinessMenuOpen(false);
              setAccountMenuOpen((open) => !open);
            }}
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            aria-label="Account menu"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/4"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/25 text-[10px] font-medium text-brand">
              {initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] text-secondary">
              {email}
            </span>
          </button>
          {accountMenuOpen ? (
            <div role="menu" aria-label="Account" className={accountDropdown}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  selectTab("settings");
                  setAccountMenuOpen(false);
                }}
                className={dropdownItem}
              >
                Settings
              </button>
              <div className="my-1 border-t border-white/8" />
              <form action={signOut}>
                <button type="submit" role="menuitem" className={dropdownItem}>
                  Log out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative flex h-12 shrink-0 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[12px] text-tertiary">
              {selectedBusiness?.name ?? "Tack"}
            </span>
            <span className="text-tertiary/50">/</span>
            <h1 className="truncate text-[15px] font-medium text-white">
              {activeTabLabel}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/" className={headerLink}>
              Home
            </Link>
            <Link
              href={
                selectedBusiness
                  ? `/onboarding?businessId=${encodeURIComponent(selectedBusiness.id)}`
                  : "/onboarding"
              }
              className="inline-flex h-8 items-center rounded-lg bg-white px-3 text-[13px] font-medium text-[#08090a] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]"
            >
              {CTA}
            </Link>
            <form action={signOut} className="ml-1 hidden sm:inline">
              <button type="submit" className={headerLogoutButton}>
                Log out
              </button>
            </form>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_50%_0%,rgba(88,92,140,0.12),transparent_65%)]"
            aria-hidden
          />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-8">
            {businessError ? (
              <p
                role="alert"
                className="mb-5 rounded-lg border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-[13px] text-red-200"
              >
                {businessError}
              </p>
            ) : null}

            {active === "sprints" ? (
              <SprintsTab
                business={selectedBusiness}
                sprints={visibleSprints}
              />
            ) : null}
            {active === "products" && selectedBusiness ? (
              <ProductsTab
                key={selectedBusiness.id}
                business={selectedBusiness}
                initialProducts={products}
                onProductsChange={setProducts}
              />
            ) : null}
            {active === "products" && !selectedBusiness ? (
              <EmptyDesk onOpenBusiness={() => selectTab("business")} />
            ) : null}
            {active === "business" ? (
              <BusinessTab
                businesses={deskBusinesses}
                selectedBusinessId={selectedBusiness?.id ?? null}
                onSelectBusiness={switchBusiness}
                onBusinessesChange={setDeskBusinesses}
              />
            ) : null}
            {active === "settings" ? (
              <SettingsTab displayName={displayName} email={email} />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyDesk({ onOpenBusiness }: { onOpenBusiness: () => void }) {
  return (
    <div className="zh-panel max-w-xl p-8">
      <h2 className="text-[22px] font-medium tracking-[-0.02em] text-white">
        Save a business first
      </h2>
      <p className="mt-3 max-w-[65ch] text-[14px] leading-6 text-secondary">
        Tack keeps the company, products, and every sprint on one desk. Add a
        URL, then come back here to reopen the work.
      </p>
      <button type="button" onClick={onOpenBusiness} className="mt-6 text-[13px] text-white underline-offset-4 hover:underline">
        Add a business
      </button>
    </div>
  );
}

export function NavIcon({ name, active }: { name: string; active?: boolean }) {
  const cls = `h-4 w-4 shrink-0 transition-colors duration-150 ${
    active ? "text-white" : "text-[#62666d] group-hover:text-[#8a8f98]"
  }`;
  const shared = {
    className: cls,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "box") {
    return (
      <svg {...shared}>
        <path d="M3 5.5 8 3l5 2.5V11L8 13.5 3 11V5.5Z" />
        <path d="M8 3v10.5M3 5.5l5 2.5 5-2.5" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg {...shared}>
        <path d="M2 14h12" />
        <path d="M4 14V9M7 14V5M10 14V8M13 14V3" />
      </svg>
    );
  }
  return (
    <svg {...shared}>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M12.7 3.3l-1.4 1.4M4.7 11.3l-1.4 1.4" />
    </svg>
  );
}
