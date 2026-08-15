"use client";

import Link from "next/link";
import { OFFER_NAME, PRICE_LABEL } from "@/lib/brand";
import type { OrderResponse } from "@/lib/types";
import type { Business } from "@/lib/workspace-types";
import { primaryButton } from "@/lib/dashboard-ui";

function statusLabel(status: OrderResponse["status"]) {
  if (status === "paid" || status === "completed") return "Paid";
  if (status === "processing") return "Running";
  if (status === "failed") return "Failed";
  return "Unpaid";
}

function statusClass(status: OrderResponse["status"]) {
  if (status === "paid" || status === "completed") {
    return "border-live/30 bg-live/10 text-live";
  }
  if (status === "failed") return "border-red-400/30 bg-red-400/10 text-red-200";
  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

export function SprintsTab({
  business,
  sprints,
}: {
  business?: Business;
  sprints: OrderResponse[];
}) {
  const runHref = business
    ? `/onboarding?businessId=${encodeURIComponent(business.id)}`
    : "/onboarding";

  if (!business) {
    return (
      <div className="zh-panel max-w-xl p-8">
        <h2 className="text-[22px] font-medium tracking-[-0.02em] text-white">
          No company on this desk yet
        </h2>
        <p className="mt-3 max-w-[65ch] text-[14px] leading-6 text-secondary">
          Run a sprint from a URL. Tack saves the business so you can reopen
          every report from here.
        </p>
        <Link href="/onboarding" className={`${primaryButton} mt-6`}>
          Start at {PRICE_LABEL}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-secondary">
            {business.name} · {business.website}
          </p>
          <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-secondary">
            Every {OFFER_NAME} run for this company. Open a report, or run another
            pass on the same brief.
          </p>
        </div>
        <Link href={runHref} className={primaryButton}>
          Run another sprint
        </Link>
      </div>

      {sprints.length === 0 ? (
        <div className="zh-panel mt-6 p-8">
          <h2 className="text-[18px] font-medium text-white">No sprints yet</h2>
          <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-secondary">
            The first run writes the teardown, personas, and 10 lines. After
            that, this list is how you come back.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8">
          {sprints.map((sprint) => (
            <li key={sprint.orderId}>
              <Link
                href={`/sprint/${sprint.orderId}`}
                className="flex items-center justify-between gap-4 bg-[#0c0d0e] px-5 py-5 transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-white">
                    {sprint.company || business.name}
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-tertiary">
                    {sprint.orderId} ·{" "}
                    {new Date(sprint.createdAt).toLocaleString()}
                  </p>
                  {sprint.niche ? (
                    <p className="mt-2 truncate text-[13px] text-secondary">
                      {sprint.niche}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-[5px] border px-2 py-0.5 text-[11px] font-medium ${statusClass(sprint.status)}`}
                >
                  {statusLabel(sprint.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
