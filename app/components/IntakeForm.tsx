"use client";

import React, { useState } from "react";
import { OrderResponse } from "@/lib/types";

interface IntakeFormProps {
  onOrderCreated: (order: OrderResponse) => void;
}

export function IntakeForm({ onOrderCreated }: IntakeFormProps) {
  const [url, setUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter your startup or product URL.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmedUrl,
          niche: niche.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      onOrderCreated(data.order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg mx-auto bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-5"
    >
      <div className="space-y-1.5">
        <label htmlFor="startup-url" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Startup Website URL <span className="text-emerald-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500 text-sm">
            https://
          </span>
          <input
            id="startup-url"
            type="text"
            required
            placeholder="yourstartup.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full pl-20 pr-4 py-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="target-niche" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Target Market / Core Niche <span className="text-zinc-500 text-[11px] font-normal lowercase">(optional)</span>
        </label>
        <input
          id="target-niche"
          type="text"
          placeholder="e.g. B2B SaaS, Developer Tool, AI Marketing"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="customer-email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Delivery Email <span className="text-zinc-500 text-[11px] font-normal lowercase">(for report receipt)</span>
        </label>
        <input
          id="customer-email"
          type="email"
          placeholder="founder@yourstartup.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700/80 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-zinc-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Initializing Autonomous Squad...
          </>
        ) : (
          <>
            Launch Intelligence Teardown • $15
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
