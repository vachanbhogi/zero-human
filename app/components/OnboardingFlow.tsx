"use client";

import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { BRAND, PRICE } from "@/lib/brand";
import {
  AgentBrief,
  DELIVERABLE_FOCUS,
  emptyAgentBrief,
  MARKET_STAGE,
  OrderResponse,
} from "@/lib/types";
import { ArrowRight, ChevronRight, Spinner, TackMark } from "./icons";

type Step = "import" | "review" | "launch";

const STEPS: Step[] = ["import", "review", "launch"];

const easeOut = [0.23, 1, 0.32, 1] as const;

export function OnboardingFlow() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("import");
  const [brief, setBrief] = useState<AgentBrief>(emptyAgentBrief);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step);

  const setField = <K extends keyof AgentBrief>(key: K, value: AgentBrief[K]) => {
    setBrief((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  async function handleScan() {
    if (!brief.url.trim()) {
      setError("Enter a website URL");
      return;
    }
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: brief.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan site");

      setBrief((prev) => ({
        ...prev,
        url: data.websiteUrl ?? prev.url,
        company: data.profile?.name ?? prev.company,
        niche: data.profile?.niche ?? prev.niche,
        audience: data.profile?.summary ?? prev.audience,
      }));
      setScanned(true);
      setShowMoreDetails(true);
      setStep("review");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to scan site. You can enter details manually.",
      );
    } finally {
      setScanning(false);
    }
  }

  async function handleLaunch() {
    if (!brief.url.trim()) {
      setError("A website URL is required");
      setStep("import");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: brief.url.trim(),
          niche: brief.niche.trim(),
          email: brief.email.trim(),
          company: brief.company.trim(),
          audience: brief.audience.trim(),
          competitors: brief.competitors
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          focus: brief.focus,
          stage: brief.stage,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create order");
      }
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#08090a] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(88,92,140,0.2),transparent_55%)]"
        aria-hidden
      />
      <div className="zh-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex h-16 max-w-300 items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2 text-white">
            <TackMark className="h-4.5 w-4.5" />
            <span className="text-[15px] font-[510] tracking-[-0.01em]">{BRAND}</span>
            <span className="ml-1 inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-live" />
              Agents online
            </span>
          </Link>
          <span className="font-mono text-[12px] tabular-nums text-tertiary">
            {order ? STEPS.length : stepIndex + 1} / {STEPS.length}
          </span>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-24 md:px-8">
        <div className="w-full max-w-300">
          <AnimatePresence mode="wait">
            {order ? (
              <motion.div key="receipt" {...slide} transition={{ duration: 0.35, ease: easeOut }}>
                <OrderReceipt
                  order={order}
                  onReset={() => {
                    setOrder(null);
                    setStep("import");
                    setBrief(emptyAgentBrief());
                    setScanned(false);
                  }}
                />
              </motion.div>
            ) : step === "import" ? (
              <motion.div key="import" {...slide} transition={{ duration: 0.35, ease: easeOut }}>
                <div className="mx-auto w-full max-w-md -translate-y-6">
                  <div className="text-center">
                    <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-[48px]">
                      Start a Tack Sprint
                    </h1>
                    <p className="mx-auto mt-4 max-w-sm text-[15px] leading-6 text-[#8a8f98]">
                      Paste your URL. Scout reads the site and drafts a brief
                      for you to review before the agents run.
                    </p>
                  </div>

                  <div className="mt-9 space-y-3">
                    <input
                      autoFocus
                      value={brief.url}
                      onChange={(e) => setField("url", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleScan()}
                      placeholder="yourstartup.com"
                      className={inputClassLg}
                    />
                    <button
                      type="button"
                      onClick={handleScan}
                      disabled={scanning || !brief.url.trim()}
                      className="flex h-11 w-full items-center justify-center rounded-xl bg-brand text-[14px] font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-40"
                    >
                      {scanning ? (
                        <span className="inline-flex items-center gap-2">
                          <Spinner />
                          Scanning site…
                        </span>
                      ) : (
                        "Scan company"
                      )}
                    </button>
                    {error ? (
                      <p className="text-center text-[13px] text-red-400">{error}</p>
                    ) : null}
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/6" aria-hidden />
                    <span className="text-[12px] text-tertiary">or</span>
                    <div className="h-px flex-1 bg-white/6" aria-hidden />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep("review");
                    }}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1.5 text-[14px] text-secondary transition-colors hover:text-white"
                  >
                    Enter details manually
                    <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                  </button>

                  <div className="mt-10 flex items-center justify-center gap-5 text-[12px] text-tertiary">
                    <span>{PRICE} flat</span>
                    <span className="h-3 w-px bg-white/10" aria-hidden />
                    <span>~3 min delivery</span>
                    <span className="h-3 w-px bg-white/10" aria-hidden />
                    <span>Terac-rated</span>
                  </div>
                </div>
              </motion.div>
            ) : step === "review" ? (
              <motion.div
                key="review"
                {...slide}
                transition={{ duration: 0.35, ease: easeOut }}
                className="w-full"
              >
                <div className="mx-auto mb-8 max-w-3xl text-center">
                  <h1 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[40px]">
                    Review your agent brief
                  </h1>
                  <p className="mx-auto mt-3 max-w-lg text-[15px] leading-6 text-[#8a8f98]">
                    {scanned
                      ? "We extracted this from your site. Edit anything before the agents run."
                      : "Set the context our agents use for research, ranking, and outreach."}
                  </p>
                </div>

                <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                  <div className="zh-panel space-y-5 p-6 sm:p-7">
                    <Field label="Company name">
                      <input
                        value={brief.company}
                        onChange={(e) => setField("company", e.target.value)}
                        placeholder="Acme Labs"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Target market / niche">
                      <input
                        value={brief.niche}
                        onChange={(e) => setField("niche", e.target.value)}
                        placeholder="B2B SaaS, developer tools"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Who you sell to">
                      <textarea
                        value={brief.audience}
                        onChange={(e) => setField("audience", e.target.value)}
                        rows={2}
                        placeholder="Seed-stage founders shipping their first paid product"
                        className={`${inputClass} resize-none`}
                      />
                    </Field>

                    <Field label="Delivery email" hint="Where the report lands">
                      <input
                        type="email"
                        value={brief.email}
                        onChange={(e) => setField("email", e.target.value)}
                        placeholder="founder@yourstartup.com"
                        className={inputClass}
                      />
                    </Field>

                    <div className="border-t border-white/[0.06] pt-4">
                      <button
                        type="button"
                        onClick={() => setShowMoreDetails((open) => !open)}
                        aria-expanded={showMoreDetails}
                        className="flex w-full items-center justify-between text-left text-[13px] font-medium text-secondary transition-colors hover:text-white"
                      >
                        More context
                        <span
                          className={`text-tertiary transition-transform duration-200 ${
                            showMoreDetails ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        >
                          ▾
                        </span>
                      </button>

                      {showMoreDetails ? (
                        <div className="mt-4 space-y-5">
                          <Field label="Known competitors" hint="Comma-separated">
                            <input
                              value={brief.competitors}
                              onChange={(e) => setField("competitors", e.target.value)}
                              placeholder="Rival Labs, Brand X"
                              className={inputClass}
                            />
                          </Field>

                          <Field label="Deliverable focus">
                            <ChipRow
                              options={DELIVERABLE_FOCUS}
                              value={brief.focus}
                              onChange={(v) => setField("focus", v)}
                            />
                          </Field>

                          <Field label="Stage">
                            <ChipRow
                              options={MARKET_STAGE}
                              value={brief.stage}
                              onChange={(v) => setField("stage", v)}
                            />
                          </Field>
                        </div>
                      ) : null}
                    </div>

                    {error ? <p className="text-[12px] text-red-400">{error}</p> : null}

                    <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                      <button
                        type="button"
                        onClick={() => setStep("import")}
                        className="text-[13px] text-secondary transition-colors hover:text-white"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!brief.url.trim()) {
                            setError("A website URL is required");
                            setStep("import");
                            return;
                          }
                          setError(null);
                          setStep("launch");
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]"
                      >
                        Continue
                        <ChevronRight />
                      </button>
                    </div>
                  </div>

                  <AgentBriefCard brief={brief} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="launch" {...slide} transition={{ duration: 0.35, ease: easeOut }}>
                <div className="mx-auto w-full max-w-2xl -translate-y-6">
                  <div className="text-center">
                    <h1 className="text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[44px]">
                      Dispatch the desk
                    </h1>
                    <p className="mx-auto mt-4 max-w-md text-[16px] leading-7 text-[#8a8f98]">
                      {PRICE} one-time for {brief.company.trim() || "your company"}. Four
                      agents research, draft, and rate the work before delivery.
                    </p>
                  </div>

                  <div className="zh-panel mt-10 p-6 text-left sm:p-8">
                    <div className="space-y-3">
                      <PipelineRow
                        index={1}
                        name="Scout"
                        detail="Reads your site and maps the offer"
                      />
                      <PipelineRow
                        index={2}
                        name="Strategist"
                        detail="Finds competitor gaps and positioning angles"
                      />
                      <PipelineRow
                        index={3}
                        name="Terac panel"
                        detail="Real humans rate the strongest variants"
                      />
                      <PipelineRow
                        index={4}
                        name="Publisher"
                        detail="Ships the executive growth report"
                      />
                    </div>

                    <div className="mt-6 rounded-lg border border-white/[0.06] bg-[#0c0d0e] p-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[13px] text-secondary">Total due today</span>
                        <span className="font-mono text-[18px] font-medium text-white">
                          {PRICE}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] leading-4 text-tertiary">
                        Payment is collected through our Stripe Payment Link. Nothing runs
                        until the order is created.
                      </p>
                    </div>

                    {error ? (
                      <p className="mt-4 text-[13px] text-red-400">{error}</p>
                    ) : null}

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
                      <button
                        type="button"
                        onClick={() => setStep("review")}
                        className="text-[14px] text-secondary transition-colors hover:text-white"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={handleLaunch}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-[14px] font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Spinner className="h-3.5 w-3.5" />
                            Creating order…
                          </>
                        ) : (
                          `Create order • ${PRICE}`
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function OrderReceipt({
  order,
  onReset,
}: {
  order: OrderResponse;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-xl -translate-y-6">
      <div className="text-center">
        <h1 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[40px]">
          Order created
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-6 text-[#8a8f98]">
          Complete payment to release the run. Agents stay idle until the payment
          clears.
        </p>
      </div>

      <div className="zh-panel mt-9 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <span className="font-mono text-[12px] text-secondary">{order.orderId}</span>
          <span className="rounded-[5px] border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            Awaiting payment
          </span>
        </div>

        <div className="space-y-3 p-5">
          <ReceiptRow label="Website" value={order.url} mono />
          <ReceiptRow label="Company" value={order.company} />
          <ReceiptRow label="Niche" value={order.niche} />
          <ReceiptRow label="Focus" value={order.focus} />
          <ReceiptRow label="Receipt email" value={order.email} />
        </div>

        <div className="border-t border-white/[0.06] p-5">
          <div className="rounded-lg border border-brand/25 bg-brand/[0.07] p-4 text-center">
            <p className="text-[13px] font-medium text-white">
              Next: pay {PRICE} via the Stripe Payment Link
            </p>
            <p className="mt-1.5 text-[11px] leading-4 text-tertiary">
              Payment Link and agent worker connect in the next build phase — this
              order is recorded, not yet paid.
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex w-full items-center justify-center text-[13px] text-tertiary transition-colors hover:text-secondary"
      >
        ← Start another order
      </button>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[12px] text-tertiary">{label}</span>
      <span
        className={`max-w-[60%] truncate text-right text-[13px] text-secondary ${
          mono ? "font-mono text-[12px]" : ""
        }`}
      >
        {value?.trim() || "—"}
      </span>
    </div>
  );
}

function PipelineRow({
  index,
  name,
  detail,
}: {
  index: number;
  name: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/15 font-mono text-[11px] text-accent">
        {index}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-white">{name}</p>
        <p className="text-[12px] leading-5 text-tertiary">{detail}</p>
      </div>
    </div>
  );
}

function AgentBriefCard({ brief }: { brief: AgentBrief }) {
  const competitorList = brief.competitors
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 4);

  const fields = [
    brief.company,
    brief.niche,
    brief.audience,
    brief.email,
    brief.focus,
    brief.stage,
  ];
  const filled = fields.filter((f) => f.trim()).length;
  const completeness = Math.round((filled / fields.length) * 100);

  return (
    <div className="zh-panel flex flex-col overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-white">Agent brief</span>
          <span className="rounded-[5px] border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-secondary">
            Live preview
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/20 text-[13px] font-semibold text-brand">
            {brief.company.trim()?.[0]?.toUpperCase() || "?"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-white">
              {brief.company.trim() || "Company name"}
            </p>
            <p className="truncate text-[11px] text-tertiary">
              {brief.url.trim() || "No website"}
            </p>
          </div>
        </div>

        <PreviewRow label="Niche" value={brief.niche} />
        <PreviewRow label="Audience" value={brief.audience} />
        <PreviewRow label="Focus" value={brief.focus} />
        <PreviewRow label="Stage" value={brief.stage} />

        {competitorList.length > 0 ? (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-tertiary">
              Competitors
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {competitorList.map((c) => (
                <span
                  key={c}
                  className="rounded-[5px] border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] text-secondary"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto rounded-lg border border-white/[0.06] bg-[#0c0d0e] p-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-tertiary">Brief completeness</span>
            <span className="font-mono text-secondary">{completeness}%</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-4 text-tertiary">
            Agents use this context for competitor research, Terac rating, and the
            final growth report.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-tertiary">
        {label}
      </p>
      <p className="mt-0.5 text-[12px] leading-5 text-secondary">
        {value?.trim() || <span className="text-tertiary/60">—</span>}
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline gap-1.5">
        <span className="text-[12px] font-medium text-white">
          {label}
          {required ? <span className="text-brand"> *</span> : null}
        </span>
        {hint ? <span className="text-[11px] text-tertiary">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-[5px] border px-2.5 py-1.5 text-[11px] transition-[border-color,background-color,color,transform] duration-150 active:scale-[0.97] ${
              selected
                ? "border-white/20 bg-white/[0.08] font-medium text-white"
                : "border-white/[0.08] bg-transparent text-secondary hover:border-white/15 hover:text-white"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-[#0c0d0e] px-3.5 py-2.5 text-[14px] text-white outline-none transition-[border-color] duration-150 placeholder:text-tertiary hover:border-white/[0.12] focus:border-white/20";

const inputClassLg =
  "w-full rounded-xl border border-white/[0.1] bg-[#0c0d0e] px-4 py-3 text-[15px] text-white outline-none transition-[border-color] duration-150 placeholder:text-tertiary hover:border-white/[0.15] focus:border-white/25";
