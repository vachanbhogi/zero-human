import { useState } from "react";
import Link from "next/link";
import { SprintReportData, OutreachPlay } from "@/lib/report-generator";
import { TackMark, ArrowRight, CheckIcon } from "./icons";
import { copyTextToClipboard } from "@/utils/copy-to-clipboard";
import { BRAND } from "@/lib/brand";

export function SprintReportView({ report }: { report: SprintReportData }) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function handleCopy(play: OutreachPlay) {
    const text = play.subject
      ? `Subject: ${play.subject}\n\n${play.body}\n\n${play.cta}`
      : `${play.body}\n\n${play.cta}`;
    if (await copyTextToClipboard(text)) {
      setCopiedId(play.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#08090a] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(88,92,140,0.18),transparent_55%)]"
        aria-hidden
      />

      <header className="sticky top-0 z-40 border-b border-white/6 bg-[#08090a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-200 items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2 text-white">
            <TackMark className="h-4.5 w-4.5" />
            <span className="text-[15px] font-[510] tracking-[-0.01em]">{BRAND}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard?tab=sprints"
              className="inline-flex h-8 items-center rounded-lg border border-white/15 bg-white/4 px-3 text-[12px] text-white transition-colors hover:bg-white/8"
            >
              Desk
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-8 items-center rounded-lg border border-white/15 bg-white/4 px-3 text-[12px] text-white transition-colors hover:bg-white/8"
            >
              Print
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-200 px-5 py-12 md:px-8">
        <p className="text-[13px] text-secondary">
          {report.companyName} · {report.url}
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
          What to do next
        </h1>
        <p className="mt-4 max-w-[65ch] text-[15px] leading-6 text-secondary">
          {report.summary}
        </p>
        <p className="mt-3 font-mono text-[12px] text-tertiary">
          {report.orderId} · {report.generatedAt}
        </p>

        <section className="zh-panel mt-10 p-6 sm:p-8">
          <h2 className="text-[22px] font-medium tracking-[-0.02em]">
            {report.nextMove.title}
          </h2>
          <p className="mt-3 max-w-[65ch] text-[14px] leading-6 text-secondary">
            {report.nextMove.why}
          </p>
          <ol className="mt-6 space-y-4">
            {report.nextMove.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-[14px] leading-6 text-foreground">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/15 font-mono text-[11px] text-accent">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="text-[22px] font-medium tracking-[-0.02em]">
            Competitors on this site
          </h2>
          <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-secondary">
            Qualitative gaps from the brief — not invented market share.
          </p>
          <div className="mt-6 divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8">
            {report.competitors.map((c) => (
              <article key={c.name} className="bg-[#0c0d0e] px-5 py-5">
                <h3 className="text-[15px] font-medium text-white">{c.name}</h3>
                <p className="mt-2 text-[13px] leading-5 text-secondary">
                  {c.whatTheyLeadWith}
                </p>
                <p className="mt-2 text-[13px] leading-5 text-foreground">
                  {c.gapYouCanOwn}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-[22px] font-medium tracking-[-0.02em]">
            Who to talk to
          </h2>
          <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-secondary">
            Taken from the audience on the order, not a generic VP matrix.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {report.personas.map((p) => (
              <article key={p.who} className="zh-panel p-5">
                <h3 className="text-[15px] font-medium text-white">{p.who}</h3>
                <p className="mt-2 text-[13px] leading-5 text-secondary">{p.whyTheyCare}</p>
                <p className="mt-3 text-[13px] leading-5 text-foreground">{p.firstMessage}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-[22px] font-medium tracking-[-0.02em]">
            10 lines you can send
          </h2>
          <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-secondary">
            Written for {report.companyName}. Copy one, send it, don&apos;t wait for a dashboard.
          </p>
          <div className="mt-6 space-y-3">
            {report.outreachPlays.map((play) => (
              <article key={play.id} className="zh-panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] text-tertiary">
                    {String(play.id).padStart(2, "0")} · {play.channel}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(play)}
                    className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-secondary transition-colors hover:border-white/20 hover:text-white"
                  >
                    {copiedId === play.id ? (
                      <span className="inline-flex items-center gap-1 text-live">
                        <CheckIcon className="h-3 w-3" />
                        Copied
                      </span>
                    ) : (
                      "Copy"
                    )}
                  </button>
                </div>
                {play.subject ? (
                  <p className="mt-3 text-[13px] text-white">{play.subject}</p>
                ) : null}
                <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-secondary">
                  {play.body}
                </p>
                <p className="mt-3 text-[13px] text-foreground">{play.cta}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-[22px] font-medium tracking-[-0.02em]">
            Terac drafts — study not complete
          </h2>
          <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-secondary">
            {report.terac.question} Cohort: {report.terac.cohort}. These are agent
            drafts for a real study. No preference rate until Terac returns.
          </p>
          <div className="zh-panel mt-6 grid overflow-hidden md:grid-cols-2">
            <div className="border-b border-white/6 p-5 md:border-b-0 md:border-r">
              <p className="text-[11px] text-tertiary">Variant A · draft</p>
              <p className="mt-3 text-[15px] leading-6">{report.terac.variantA}</p>
            </div>
            <div className="p-5">
              <p className="text-[11px] text-accent">Variant B · working line until results</p>
              <p className="mt-3 text-[15px] leading-6">{report.terac.variantB}</p>
            </div>
          </div>
        </section>

        <div className="mt-16 flex flex-col items-start gap-3 border-t border-white/6 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[14px] font-medium text-[#08090a] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]"
          >
            Run another URL
            <ArrowRight className="h-3.5 w-3.5 opacity-70" />
          </Link>
          <p className="text-[12px] text-tertiary">
            Incomplete Terac and unpaid orders stay labeled. Don&apos;t present drafts as live studies.
          </p>
        </div>
      </main>
    </div>
  );
}
