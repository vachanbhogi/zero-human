"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SprintReportView } from "@/app/components/SprintReportView";
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

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    async function load() {
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

  if (order) {
    return <SprintReportView report={generateSprintReport(order)} />;
  }

  if (failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#08090a] px-5 text-center text-white">
        <p className="text-[15px] text-secondary">
          That sprint isn&apos;t on this machine. Create it again from a URL.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 rounded-lg bg-white px-4 py-2.5 text-[14px] font-medium text-[#08090a]"
        >
          Start a sprint
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08090a] text-[14px] text-secondary">
      Loading sprint…
    </div>
  );
}
