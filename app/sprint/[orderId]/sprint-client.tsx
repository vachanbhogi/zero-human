"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SprintReportView } from "@/app/components/SprintReportView";
import { SprintProgressView } from "@/app/components/SprintProgressView";
import { generateSprintReport } from "@/lib/report-generator";
import { ORDER_STORAGE_KEY } from "@/lib/order-storage";
import { OrderResponse } from "@/lib/types";

function isOrder(value: unknown): value is OrderResponse {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return typeof o.orderId === "string" && typeof o.url === "string";
}

export default function SprintClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [showProgressTrace, setShowProgressTrace] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("paid") === "true" || !!params.get("session_id");
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      if (sessionId) {
        fetch(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`).catch(console.warn);
      }
    }
  }, []);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    async function load() {
      if (orderId === "demo" || orderId === "ord_demo") {
        if (!cancelled) {
          setOrder({
            orderId: "ord_demo",
            status: "paid",
            createdAt: new Date().toISOString(),
            url: "https://tack.zero-human.ai",
            niche: "Autonomous Growth Desks",
            email: "founder@tack.ai",
            company: "Tack",
            audience: "High-growth startups, founders, and demand gen operators",
            competitors: ["Clay", "Apollo.io", "Lavender"],
          });
        }
        return;
      }

      try {
        const stored = sessionStorage.getItem(`${ORDER_STORAGE_KEY}:${orderId}`);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isOrder(parsed) && parsed.orderId === orderId) {
            if (!cancelled) setOrder(parsed);
            return;
          }
        }
      } catch {
        /* continue */
      }

      try {
        const res = await fetch(`/api/order?id=${encodeURIComponent(orderId)}`);
        const data: unknown = await res.json();
        if (
          res.ok &&
          data &&
          typeof data === "object" &&
          "order" in data &&
          isOrder((data as { order: unknown }).order)
        ) {
          if (!cancelled) setOrder((data as { order: OrderResponse }).order);
          return;
        }
      } catch {
        /* continue */
      }

      if (!cancelled) setFailed(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (order && showProgressTrace) {
    return (
      <div className="min-h-screen bg-[#08090a]">
        <SprintProgressView
          companyName={order.company}
          url={order.url}
          onComplete={() => setShowProgressTrace(false)}
        />
      </div>
    );
  }

  if (order) {
    return <SprintReportView report={generateSprintReport(order)} />;
  }

  if (failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#08090a] px-5 text-center text-white">
        <p className="text-[15px] text-secondary">
          We couldn&apos;t find that sprint. Start again from a URL.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 rounded-lg bg-white px-5 py-2.5 text-[14px] font-medium text-[#08090a] transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Start a sprint
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090a]">
      <SprintProgressView url={orderId} />
    </div>
  );
}
