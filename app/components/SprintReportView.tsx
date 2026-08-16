"use client";

import { useState } from "react";
import Link from "next/link";
import { SprintReportData, OutreachPlay } from "@/lib/report-generator";
import { TackMark, ArrowRight, CheckIcon } from "./icons";
import { copyTextToClipboard } from "@/utils/copy-to-clipboard";
import { BRAND } from "@/lib/brand";

export function SprintReportView({ report }: { report: SprintReportData }) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedFullReport, setCopiedFullReport] = useState(false);
  const [channelFilter, setChannelFilter] = useState<"All" | "Email" | "DM" | "In person">("All");

  async function handleCopy(play: OutreachPlay) {
    const text = play.subject
      ? `Subject: ${play.subject}\n\n${play.body}\n\nCTA: ${play.cta}`
      : `${play.body}\n\nCTA: ${play.cta}`;
    if (await copyTextToClipboard(text)) {
      setCopiedId(play.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    }
  }

  async function handleCopyAll() {
    const fullMarkdown = `# ${report.companyName} — Growth Brief & Playbook
URL: ${report.url}
Generated: ${report.generatedAt}

## Executive Summary
${report.summary}

## Immediate Next Move
${report.nextMove.title}
${report.nextMove.why}
${report.nextMove.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Top Competitors
${report.competitors.map((c) => `### ${c.name}\n- Lead: ${c.whatTheyLeadWith}\n- Gap You Own: ${c.gapYouCanOwn}`).join("\n\n")}

## 10 Outreach Plays
${report.outreachPlays.map((p) => `### Play #${p.id} (${p.channel})\n${p.subject ? `Subject: ${p.subject}\n` : ""}${p.body}\nCTA: ${p.cta}`).join("\n\n")}
`;
    if (await copyTextToClipboard(fullMarkdown)) {
      setCopiedFullReport(true);
      window.setTimeout(() => setCopiedFullReport(false), 2000);
    }
  }

  const filteredPlays =
    channelFilter === "All"
      ? report.outreachPlays
      : report.outreachPlays.filter((p) => p.channel === channelFilter);

  return (
    <div className="relative min-h-screen bg-[#08090a] text-white print:bg-white print:text-black">
      {/* Background Glow (hidden on print) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(88,92,140,0.18),transparent_55%)] print:hidden"
        aria-hidden
      />

      {/* App Header (hidden on print) */}
      <header className="sticky top-0 z-40 border-b border-white/6 bg-[#08090a]/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-16 max-w-220 items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/6 border border-white/10">
              <TackMark className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-[510] tracking-[-0.01em]">{BRAND}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center rounded-lg border border-white/15 bg-white/4 px-3 text-[12px] text-white transition-colors hover:bg-white/8"
            >
              Open Desk
            </Link>
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-white/4 px-3 text-[12px] text-white transition-colors hover:bg-white/8"
            >
              {copiedFullReport ? (
                <span className="text-live flex items-center gap-1">
                  <CheckIcon className="h-3 w-3" /> Copied Markdown
                </span>
              ) : (
                "Copy Markdown"
              )}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-8 items-center rounded-lg bg-white px-3 text-[12px] font-medium text-[#08090a] transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Report Container */}
      <main className="relative mx-auto max-w-220 px-5 py-12 md:px-8 print:py-0 print:px-0">
        {/* Paid confirmation pill if session redirected */}
        {typeof window !== "undefined" && window.location.search.includes("paid=true") ? (
          <div className="mb-8 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-[13px] text-emerald-300 print:hidden">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Order Confirmed · Autonomous Growth Desk Active
            </span>
            <span className="font-mono text-[11px] text-emerald-400/80">Stripe Live</span>
          </div>
        ) : null}

        {/* Company Title & Meta */}
        <div className="border-b border-white/8 pb-8 print:border-black/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-md border border-brand/40 bg-brand/10 px-2.5 py-0.5 font-mono text-[11px] text-accent print:text-black">
              Executive Intelligence Brief
            </span>
            <span className="font-mono text-[12px] text-tertiary print:text-gray-600">
              ID: {report.orderId} · {report.generatedAt}
            </span>
          </div>

          <h1 className="mt-4 text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[44px] print:text-[28px] print:text-black">
            {report.companyName}
          </h1>
          <p className="mt-1 text-[15px] font-mono text-secondary print:text-gray-700">
            {report.url} · {report.niche}
          </p>

          <p className="mt-5 max-w-[65ch] text-[15px] leading-7 text-[#d0d4dc] print:text-black">
            {report.summary}
          </p>
        </div>

        {/* Section 1: Immediate Next Move */}
        <section className="zh-panel mt-10 p-6 sm:p-8 print:border print:border-gray-300 print:bg-white print:p-4 print:shadow-none">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-accent print:text-gray-700">
              01 · Immediate Priority
            </span>
            <span className="rounded-full bg-brand/15 px-2.5 py-0.5 font-mono text-[10px] text-accent print:hidden">
              Next Move
            </span>
          </div>

          <h2 className="mt-3 text-[22px] font-medium tracking-[-0.02em] print:text-black">
            {report.nextMove.title}
          </h2>
          <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-secondary print:text-gray-700">
            {report.nextMove.why}
          </p>

          <ol className="mt-6 space-y-3">
            {report.nextMove.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-[14px] leading-6 text-foreground print:text-black">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/15 font-mono text-[11px] text-accent print:border print:border-gray-300 print:bg-gray-100 print:text-black">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Section 2: Competitor Vulnerabilities */}
        <section className="mt-14 print:mt-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-accent print:text-gray-700">
                02 · Competitor Intelligence
              </span>
              <h2 className="mt-1 text-[22px] font-medium tracking-[-0.02em] print:text-black">
                Competitor positioning & gaps you can own
              </h2>
            </div>
          </div>

          <div className="mt-6 divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8 bg-[#0c0d0e] print:border-gray-300 print:bg-white print:divide-gray-200">
            {report.competitors.map((c) => (
              <article key={c.name} className="p-5 print:p-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[15px] font-medium text-white print:text-black">{c.name}</h3>
                  <span className="font-mono text-[11px] text-tertiary">Competitor</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 text-[13px]">
                  <div className="rounded-lg border border-white/6 bg-white/2 p-3 print:border-gray-200 print:bg-gray-50">
                    <p className="font-mono text-[10px] uppercase text-tertiary print:text-gray-600">
                      What they lead with
                    </p>
                    <p className="mt-1 text-secondary print:text-gray-700">{c.whatTheyLeadWith}</p>
                  </div>
                  <div className="rounded-lg border border-brand/20 bg-brand/5 p-3 print:border-gray-200 print:bg-gray-50">
                    <p className="font-mono text-[10px] uppercase text-accent print:text-gray-800">
                      Your competitive wedge
                    </p>
                    <p className="mt-1 text-foreground print:text-black">{c.gapYouCanOwn}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Section 3: Target Personas */}
        <section className="mt-14 print:mt-8">
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent print:text-gray-700">
            03 · Ideal Customer Profile
          </span>
          <h2 className="mt-1 text-[22px] font-medium tracking-[-0.02em] print:text-black">
            Who to contact first
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {report.personas.map((p) => (
              <article key={p.who} className="zh-panel p-5 print:border print:border-gray-300 print:bg-white print:shadow-none">
                <h3 className="text-[15px] font-medium text-white print:text-black">{p.who}</h3>
                <p className="mt-2 text-[13px] leading-5 text-secondary print:text-gray-700">
                  {p.whyTheyCare}
                </p>
                <div className="mt-4 rounded-lg border border-white/6 bg-white/3 p-3 text-[12px] leading-5 text-foreground print:border-gray-200 print:bg-gray-50 print:text-black">
                  <p className="font-mono text-[10px] uppercase text-tertiary print:text-gray-600">
                    Opening Hook
                  </p>
                  <p className="mt-1">{p.firstMessage}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Section 4: 10 Outreach Plays */}
        <section className="mt-14 print:mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-accent print:text-gray-700">
                04 · Actionable Playbook
              </span>
              <h2 className="mt-1 text-[22px] font-medium tracking-[-0.02em] print:text-black">
                10 Tailored Outreach Plays
              </h2>
            </div>

            {/* Channel Filters (hidden on print) */}
            <div className="flex flex-wrap gap-1.5 print:hidden">
              {(["All", "Email", "DM", "In person"] as const).map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setChannelFilter(channel)}
                  className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
                    channelFilter === channel
                      ? "bg-white text-[#08090a]"
                      : "border border-white/10 bg-white/4 text-secondary hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {channel === "In person" ? "Call / Meet" : channel}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3.5">
            {filteredPlays.map((play) => (
              <article
                key={play.id}
                className="zh-panel p-5 transition-colors hover:border-white/15 print:border print:border-gray-300 print:bg-white print:p-4 print:shadow-none"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded bg-white/6 px-2 py-0.5 font-mono text-[11px] text-accent print:bg-gray-100 print:text-black">
                    Play #{String(play.id).padStart(2, "0")} · {play.channel}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopy(play)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] text-secondary transition-colors hover:border-white/20 hover:text-white print:hidden"
                  >
                    {copiedId === play.id ? (
                      <span className="inline-flex items-center gap-1 text-live font-medium">
                        <CheckIcon className="h-3 w-3" />
                        Copied
                      </span>
                    ) : (
                      "Copy Play"
                    )}
                  </button>
                </div>

                {play.subject ? (
                  <p className="mt-3 text-[14px] font-medium text-white print:text-black">
                    <span className="text-secondary font-normal print:text-gray-600">Subject: </span>
                    {play.subject}
                  </p>
                ) : null}

                <p className="mt-2.5 whitespace-pre-line text-[13px] leading-6 text-[#d0d4dc] print:text-black">
                  {play.body}
                </p>

                <div className="mt-3 rounded border border-white/6 bg-white/2 px-3 py-1.5 text-[12px] text-accent font-medium print:border-gray-200 print:bg-gray-50 print:text-black">
                  <span className="text-tertiary font-mono uppercase text-[10px] print:text-gray-600">CTA: </span>
                  {play.cta}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Section 5: Terac Preference Loop Status */}
        <section className="mt-14 print:mt-8">
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent print:text-gray-700">
            05 · Terac Human Preference Test
          </span>
          <h2 className="mt-1 text-[22px] font-medium tracking-[-0.02em] print:text-black">
            Crowd preference validation
          </h2>
          <p className="mt-2 text-[13px] text-secondary print:text-gray-600">
            Study Cohort: {report.terac.cohort} · {report.terac.question}
          </p>

          <div className="zh-panel mt-6 grid overflow-hidden md:grid-cols-2 print:border print:border-gray-300 print:bg-white print:shadow-none">
            <div className="border-b border-white/6 p-5 md:border-b-0 md:border-r print:border-gray-200">
              <p className="text-[11px] font-mono text-tertiary print:text-gray-600">Variant A (Draft)</p>
              <p className="mt-3 text-[14px] leading-6 text-secondary print:text-gray-700">{report.terac.variantA}</p>
            </div>
            <div className="bg-brand/5 p-5 print:bg-gray-50">
              <p className="text-[11px] font-mono text-accent print:text-black">Variant B (Working / Optimized)</p>
              <p className="mt-3 text-[14px] leading-6 text-white font-medium print:text-black">{report.terac.variantB}</p>
            </div>
          </div>
        </section>

        {/* Bottom Actions (hidden on print) */}
        <div className="mt-16 flex flex-col items-start gap-4 border-t border-white/6 pt-8 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[14px] font-medium text-[#08090a] transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <span>Run Another Sprint</span>
            <ArrowRight className="h-3.5 w-3.5 opacity-70" />
          </Link>

          <Link
            href="/dashboard"
            className="text-[13px] text-secondary hover:text-white underline-offset-4 hover:underline"
          >
            View all company sprints in Growth Desk →
          </Link>
        </div>
      </main>
    </div>
  );
}
