"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SprintReportData, OutreachPlay } from "@/lib/report-generator";
import { TackMark, ArrowRight, CheckIcon } from "./icons";
import { copyTextToClipboard } from "@/utils/copy-to-clipboard";
import { BRAND } from "@/lib/brand";

interface SprintReportViewProps {
  report: SprintReportData;
}

type TabType = "all" | "competitors" | "personas" | "outreach" | "terac";

export function SprintReportView({ report }: SprintReportViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (play: OutreachPlay) => {
    const textToCopy = play.subject
      ? `Subject: ${play.subject}\n\n${play.body}\n\n${play.cta}`
      : `${play.body}\n\n${play.cta}`;

    const success = await copyTextToClipboard(textToCopy);
    if (success) {
      setCopiedId(play.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-white">
      {/* Background radial atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(16,185,129,0.12),transparent_60%)]" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#08090a]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2 text-white">
            <TackMark className="h-4.5 w-4.5 text-emerald-400" />
            <span className="text-[15px] font-[510] tracking-tight">{BRAND}</span>
            <span className="ml-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-400">
              Sprint Report
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] text-emerald-400 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Delivered in {report.latencySeconds}s
            </span>
            <button
              onClick={() => window.print()}
              className="inline-flex h-8 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-[12px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Export / Print
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative mx-auto max-w-5xl px-5 py-10 md:px-8 space-y-10">
        {/* Executive Hero */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-wider text-emerald-400">
                Autonomous Executive Intelligence
              </p>
              <h1 className="text-[32px] sm:text-[40px] font-bold tracking-tight text-white leading-tight">
                {report.companyName} Sprint Brief
              </h1>
            </div>
            <div className="text-right text-xs text-zinc-400 font-mono">
              <p>ID: {report.orderId}</p>
              <p>{report.generatedAt}</p>
            </div>
          </div>

          <p className="text-[15px] text-zinc-300 max-w-3xl leading-relaxed">
            {report.executiveSummary.coreOffering}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e] p-3.5">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Target Niche</p>
              <p className="text-[13px] font-medium text-zinc-200 mt-1 truncate">{report.niche}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e] p-3.5">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Competitors Mapped</p>
              <p className="text-[13px] font-medium text-zinc-200 mt-1">{report.competitors.length} Rivals Analyzed</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e] p-3.5">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Outreach Plays</p>
              <p className="text-[13px] font-medium text-zinc-200 mt-1">{report.outreachPlays.length} Custom Angles</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0d0e] p-3.5">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Terac Crowd Lift</p>
              <p className="text-[13px] font-medium text-emerald-400 mt-1">+38% Intent</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-3">
          {[
            { id: "all", label: "Full Report" },
            { id: "competitors", label: "Competitor Teardown" },
            { id: "personas", label: "Buyer Personas" },
            { id: "outreach", label: "10 Outreach Plays" },
            { id: "terac", label: "Terac Human Benchmark" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECTION 1: COMPETITOR TEARDOWN */}
        {(activeTab === "all" || activeTab === "competitors") && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[20px] font-semibold text-white tracking-tight flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 text-xs">
                  1
                </span>
                5-Pillar Competitor Teardown
              </h2>
              <span className="text-xs text-zinc-500">Vulnerabilities & Attack Wedges</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {report.competitors.map((comp, idx) => (
                <div
                  key={comp.name}
                  className="rounded-2xl border border-white/[0.08] bg-[#0c0d0e] p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-[15px]">{comp.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
                        {comp.marketShare}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-zinc-400">
                        <strong className="text-zinc-300 font-medium">Strength:</strong> {comp.strength}
                      </p>
                      <p className="text-amber-300/90">
                        <strong className="text-amber-200 font-medium">Vulnerability:</strong> {comp.vulnerability}
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300">
                    <strong className="font-semibold">Winning Wedge:</strong> {comp.winningAngle}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: CUSTOMER PERSONA MATRIX */}
        {(activeTab === "all" || activeTab === "personas") && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[20px] font-semibold text-white tracking-tight flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 text-xs">
                  2
                </span>
                High-Intent Customer Persona Matrix
              </h2>
              <span className="text-xs text-zinc-500">Target Buyer Archetypes</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {report.personas.map((persona) => (
                <div
                  key={persona.role}
                  className="rounded-2xl border border-white/[0.08] bg-[#0c0d0e] p-5 space-y-3"
                >
                  <div>
                    <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                      {persona.seniority}
                    </span>
                    <h3 className="text-[16px] font-semibold text-white">{persona.role}</h3>
                    <p className="text-xs text-zinc-500">{persona.companyProfile}</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-zinc-500 uppercase tracking-wider text-[10px]">Core Pain Point</p>
                      <p className="text-zinc-300 mt-0.5">{persona.corePainPoint}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 uppercase tracking-wider text-[10px]">Urgent Trigger Event</p>
                      <p className="text-zinc-300 mt-0.5">{persona.triggerEvent}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
                      <p className="text-[10px] text-zinc-400 uppercase font-semibold">Objection Killer</p>
                      <p className="text-zinc-200 mt-0.5 text-[11px]">{persona.objectionKiller}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: 10 OUTREACH PLAYS */}
        {(activeTab === "all" || activeTab === "outreach") && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[20px] font-semibold text-white tracking-tight flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 text-xs">
                  3
                </span>
                10 Tailored Cold Outreach Plays
              </h2>
              <span className="text-xs text-zinc-500">1-Click Copy-to-Clipboard</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {report.outreachPlays.map((play) => (
                <div
                  key={play.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0c0d0e] p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                        Play #{play.id} • {play.channel}
                      </span>
                      <button
                        onClick={() => handleCopy(play)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/15 hover:text-white"
                      >
                        {copiedId === play.id ? (
                          <>
                            <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>Copy Script</>
                        )}
                      </button>
                    </div>

                    {play.subject && (
                      <p className="text-xs text-zinc-400">
                        <strong className="text-zinc-200">Subject:</strong> {play.subject}
                      </p>
                    )}

                    <div className="rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300 font-mono whitespace-pre-line border border-zinc-800/80 leading-relaxed">
                      {play.body}
                    </div>

                    <p className="text-xs text-emerald-300/90 font-medium">
                      <strong>Call to action:</strong> {play.cta}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 4: TERAC HUMAN BENCHMARK */}
        {(activeTab === "all" || activeTab === "terac") && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[20px] font-semibold text-white tracking-tight flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 text-xs">
                  4
                </span>
                Terac Human-in-the-Loop Benchmark
              </h2>
              <span className="text-xs text-zinc-500">Live Crowd Preference Study</span>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-6 sm:p-7 space-y-5">
              <div>
                <p className="text-xs text-emerald-400 uppercase font-semibold tracking-wider">
                  Crowd Study Question
                </p>
                <h3 className="text-[17px] font-medium text-white mt-1">
                  &ldquo;{report.teracEvidence.question}&rdquo;
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 space-y-1">
                  <p className="text-[11px] text-zinc-500 uppercase font-semibold">Variant A (Cost & Hours)</p>
                  <p className="text-xs text-zinc-300">{report.teracEvidence.variantA}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-emerald-400 uppercase font-semibold">
                      Variant B (Velocity & Moat) ★ WINNER
                    </p>
                    <span className="text-[10px] bg-emerald-500 text-zinc-950 font-bold px-1.5 py-0.5 rounded">
                      68% Votes
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200">{report.teracEvidence.variantB}</p>
                </div>
              </div>

              <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800 space-y-1 text-xs text-zinc-300">
                <p className="font-semibold text-emerald-400">Key Finding & Metric Lift:</p>
                <p>{report.teracEvidence.keyFinding}</p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: NEXT MOVE RECOMMENDATION */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#0c0d0e] p-6 sm:p-7 space-y-4">
          <div>
            <span className="text-[11px] font-mono uppercase text-emerald-400">
              {report.nextMoveRecommendation.timeframe}
            </span>
            <h2 className="text-[20px] font-semibold text-white">{report.nextMoveRecommendation.title}</h2>
          </div>

          <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
            {report.nextMoveRecommendation.actionSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-400 text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 border-t border-white/[0.06] text-xs text-zinc-400">
            <strong className="text-emerald-400 font-semibold">Expected Impact:</strong>{" "}
            {report.nextMoveRecommendation.expectedImpact}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="pt-6 text-center space-y-3">
          <Link
            href="/onboarding"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-semibold text-zinc-950 transition-all hover:bg-zinc-200 active:scale-[0.98]"
          >
            Run Another Sprint
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-zinc-600">Zero Human • 100% Autonomous Growth Desk</p>
        </div>
      </main>
    </div>
  );
}
