"use client";

import { useState, type ReactNode } from "react";
import { CTA } from "@/lib/brand";

export function PayCta({
  className,
  children,
  orderId,
  company,
  url,
  email,
}: {
  className?: string;
  children?: ReactNode;
  orderId?: string;
  company?: string;
  url?: string;
  email?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          company,
          url,
          email,
        }),
      });

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.warn("[PayCta Checkout Exception]:", err);
    }

    // Fallback to the live hosted Stripe link if the API fails; never a test link.
    const fallbackLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
    if (fallbackLink) {
      window.location.href = fallbackLink;
      return;
    }
    setLoading(false);
    alert("Checkout is temporarily unavailable. Please try again.");
  }

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Opening checkout…
        </span>
      ) : (
        children ?? CTA
      )}
    </button>
  );
}
