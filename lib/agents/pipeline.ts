// Pipeline orchestrator: order -> Scout -> Analyst -> Copywriter -> validate.
//
// Payment/webhook handling, dispatch claiming, order persistence, and report
// rendering are owned elsewhere (see CONTRACT.md v2). This module wires the
// pipeline core together and is intentionally dependency-injected so it can
// be unit tested without hitting the network or a real Groq key.
//
// Per CONTRACT.md v2 section 5, the pipeline persists validated SprintResult
// JSON, never rendered HTML — rendering happens at view time in Codex-owned
// React components. runSprint therefore returns only { sprintResult }, and
// validates it before returning so an invalid result can never reach
// OrdersServer.completeOrder (see validateSprintResult below).

import type { OrdersServer, SprintResult, SourceRef, CompetitorEntry } from "@/lib/pipeline-types";
import type { OrderResponse } from "@/lib/types";
import { getSiteFacts, type SiteFacts } from "@/lib/agents/scout";
import { runAnalyst, type AnalystOutput } from "@/lib/agents/analyst";
import { runCopywriter, type CopywriterOutput } from "@/lib/agents/copywriter";
import type { LlmCallFn } from "@/lib/agents/analyst";
import { validateSprintResult } from "@/lib/agents/validate";

export class PipelineError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "PipelineError";
  }
}

export interface PipelineDeps {
  ordersServer: OrdersServer;
  /** Injected for tests; defaults to the real fetch-based Scout call. */
  getSiteFacts?: (url: string) => Promise<SiteFacts>;
  /** Injected for tests; defaults to the real Groq API call. Shared by
   *  the Analyst and Copywriter agents so a single mock covers both. */
  llmCall?: LlmCallFn;
}

function deriveCompanyName(order: OrderResponse, profile: SiteFacts["profile"]): string {
  if (order.company?.trim()) return order.company.trim();
  if (profile.name?.trim()) return profile.name.trim();
  try {
    const host = new URL(order.url.startsWith("http") ? order.url : `https://${order.url}`).hostname;
    return host.replace(/^www\./, "");
  } catch {
    return order.url;
  }
}

function collectSources(scoutSource: SourceRef, competitors: CompetitorEntry[]): SourceRef[] {
  const byUrl = new Map<string, SourceRef>();
  byUrl.set(scoutSource.url, scoutSource);
  for (const competitor of competitors) {
    for (const source of competitor.sources) {
      byUrl.set(source.url, source);
    }
  }
  return [...byUrl.values()];
}

function selectVariant(): "A" | "B" {
  // The Terac benchmark study picks the eventual default; until that result
  // is wired in, this env var lets ops flip the default without a deploy.
  return process.env.PIPELINE_VARIANT === "B" ? "B" : "A";
}

export interface RunSprintResult {
  sprintResult: SprintResult;
}

export async function runSprint(orderId: string, deps: PipelineDeps): Promise<RunSprintResult> {
  const scout = deps.getSiteFacts ?? getSiteFacts;

  const order = await deps.ordersServer.getOrder(orderId);
  if (!order) {
    throw new PipelineError(`Order not found: ${orderId}`);
  }

  const { profile, source: scoutSource } = await scout(order.url);

  const analysis: AnalystOutput = await runAnalyst(
    { profile, source: scoutSource, order },
    { llmCall: deps.llmCall }
  );

  const copy: CopywriterOutput = await runCopywriter(
    {
      execSummary: analysis.execSummary,
      competitors: analysis.competitors,
      personas: analysis.personas,
      order,
    },
    { llmCall: deps.llmCall }
  );

  const variantUsed = selectVariant();
  const chosenVariant = copy[variantUsed];

  const sprintResult: SprintResult = {
    orderId,
    company: deriveCompanyName(order, profile),
    generatedAt: new Date().toISOString(),
    execSummary: analysis.execSummary,
    competitors: analysis.competitors,
    personas: analysis.personas,
    outreach: chosenVariant.outreach,
    nextMove: chosenVariant.nextMove,
    variantUsed,
    // No completed Terac study is wired into the pipeline yet; the Terac
    // winner will populate a { status: "completed", ... } result later.
    terac: { status: "not_run" },
    sources: collectSources(scoutSource, analysis.competitors),
  };

  // Refuse to hand back (and therefore persist) an invalid result —
  // validateSprintResult throws ValidationError, which propagates to
  // app/api/run/route.ts's catch block and triggers failOrder instead of
  // completeOrder.
  validateSprintResult(sprintResult);

  return { sprintResult };
}
