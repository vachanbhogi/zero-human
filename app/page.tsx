"use client";

import React, { useState } from "react";
import { Hero } from "./components/Hero";
import { IntakeForm } from "./components/IntakeForm";
import { OrderResponse } from "@/lib/types";

export default function Home() {
  const [currentOrder, setCurrentOrder] = useState<OrderResponse | null>(null);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Navbar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
            0H
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-white">ZERO HUMAN</div>
            <div className="text-[11px] text-zinc-500">Autonomous Business Intelligence</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900 border border-zinc-700/60 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Agent Core: Online
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-8 w-full max-w-4xl mx-auto">
        <Hero />

        {!currentOrder ? (
          <IntakeForm onOrderCreated={(order) => setCurrentOrder(order)} />
        ) : (
          <div className="w-full max-w-lg mx-auto bg-zinc-900/90 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Order Initialized</h3>
                <p className="text-xs text-zinc-400 font-mono">ID: {currentOrder.orderId}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 border border-amber-500/40 text-amber-300">
                Awaiting Payment
              </span>
            </div>

            <div className="space-y-2 text-xs text-zinc-300 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex justify-between">
                <span className="text-zinc-500">Target Website:</span>
                <span className="font-mono text-zinc-200 truncate max-w-[200px]">{currentOrder.url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Niche:</span>
                <span className="text-zinc-200">{currentOrder.niche}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Receipt Email:</span>
                <span className="text-zinc-200">{currentOrder.email}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-center space-y-3">
              <div className="text-xs text-emerald-300 font-medium">
                Ready for autonomous execution ($15 USD)
              </div>
              <div className="text-[11px] text-zinc-400">
                Stripe payment rails & agent worker connect in the next phase.
              </div>
            </div>

            <button
              onClick={() => setCurrentOrder(null)}
              className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              ← Enter a different URL
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-zinc-800/80 text-center text-xs text-zinc-600">
        Zero Human Inc. • Autonomous Enterprise Systems • Hackathon Live Build
      </footer>
    </main>
  );
}
