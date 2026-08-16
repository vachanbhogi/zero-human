"use client";

import { useState, type ReactNode } from "react";
import { CTA } from "@/lib/brand";
import { stripePaymentLink } from "@/lib/pay";

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
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
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

      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }

      const fallback = stripePaymentLink();
      if (fallback) {
        window.location.href = fallback;
        return;
      }

      setError(
        data?.error ||
          "Checkout didn’t open. Try the button again, or refresh this page.",
      );
    } catch {
      const fallback = stripePaymentLink();
      if (fallback) {
        window.location.href = fallback;
        return;
      }
      setError("Checkout didn’t open. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
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
      {error ? (
        <p className="mt-2 text-center text-[13px] text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
