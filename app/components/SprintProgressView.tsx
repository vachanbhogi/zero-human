"use client";

import { useEffect, useState } from "react";
import { Spinner, TackMark, CheckIcon } from "./icons";

interface StepStatus {
  id: string;
  agent: string;
  title: string;
  detail: string;
  durationMs: number;
}

const PIPELINE_STEPS: StepStatus[] = [
  {
    id: "scout",
    agent: "Brief",
    title: "Reading the company, audience, and URL you confirmed",
    detail: "Using the intake — not a live recrawl of the public web",
    durationMs: 2500,
  },
  {
    id: "analyst",
    agent: "Competitors",
    title: "Drafting gaps vs the names in your brief",
    detail: "What they lead with, and the wedge you can own",
    durationMs: 3000,
  },
  {
    id: "copywriter",
    agent: "Outreach",
    title: "Writing 10 lines you can send tonight",
    detail: "Email, DM, and in-person opens for this audience",
    durationMs: 3500,
  },
  {
    id: "terac",
    agent: "Headlines",
    title: "Queuing two headline variants for a later preference test",
    detail: "Marked as drafts until a Terac study actually returns",
    durationMs: 2500,
  },
  {
    id: "publisher",
    agent: "Pack",
    title: "Formatting the next move, teardown, and plays",
    detail: "One screen you can copy, print, or send",
    durationMs: 2000,
  },
];

export function SprintProgressView({
  companyName,
  url,
  onComplete,
}: {
  companyName?: string;
  url: string;
  onComplete?: () => void;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (currentStepIndex >= PIPELINE_STEPS.length) {
      if (onComplete) {
        const timeout = setTimeout(onComplete, 800);
        return () => clearTimeout(timeout);
      }
      return;
    }

    const currentStep = PIPELINE_STEPS[currentStepIndex];
    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, currentStep.durationMs);

    return () => clearTimeout(timer);
  }, [currentStepIndex, onComplete]);

  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIndex + 0.5) / PIPELINE_STEPS.length) * 100)
  );

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-white">
      <div className="w-full max-w-xl">
        {/* Header summary */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 border border-brand/35 text-accent shadow-lg shadow-brand/10">
            <TackMark className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">
            Building the pack
          </h2>

          <p className="mt-2 text-[14px] text-secondary">
            Synthesizing intelligence for{" "}
            <span className="font-medium text-white">{companyName || url}</span>
          </p>

          {/* Progress bar */}
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full bg-linear-to-r from-brand to-accent transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Live Step Stream */}
        <div className="zh-panel mt-8 divide-y divide-white/6 overflow-hidden p-0 shadow-2xl">
          {PIPELINE_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3.5 p-4 sm:p-5 transition-colors ${
                  isCurrent
                    ? "bg-white/[0.03]"
                    : isDone
                    ? "bg-transparent opacity-80"
                    : "opacity-40"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-live/20 text-live">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </div>
                  ) : isCurrent ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 text-accent">
                      <Spinner className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-[11px] font-mono text-tertiary">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-accent">
                      {step.agent}
                    </span>
                    {isCurrent && (
                      <span className="font-mono text-[10px] text-live animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[14px] font-medium text-white">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-5 text-secondary">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[12px] text-tertiary">
          About 15 seconds. This is the brief compiling — not a live 3-minute run.
        </p>
      </div>
    </div>
  );
}
