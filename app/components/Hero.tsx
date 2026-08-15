import React from "react";

export function Hero() {
  return (
    <div className="text-center space-y-4 max-w-2xl mx-auto pt-8 pb-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-medium tracking-wide">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        ZERO HUMAN • 100% AUTONOMOUS COMPANY
      </div>

      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
        Instant Competitor Intelligence & Growth Teardown
      </h1>

      <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
        Input your startup URL. Our autonomous AI squad crawls your product, maps competitor vulnerabilities, benchmarks copy with real human raters on Terac, and delivers an executive growth playbook in 3 minutes.
      </p>

      <div className="flex items-center justify-center gap-6 text-xs text-zinc-500 pt-1">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          $15 Flat One-Time
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          ~3 Min Delivery
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Terac Crowd Benchmark
        </span>
      </div>
    </div>
  );
}
