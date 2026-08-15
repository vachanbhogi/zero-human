// Pipeline orchestrator: order -> Scout -> Analyst -> Copywriter -> render -> store.
//
// Payment/webhook handling, order persistence, and final HTML rendering are
// owned elsewhere (see file header notes below). This module wires the
// pipeline core together and is intentionally dependency-injected so it can
// be unit tested without hitting the network or a real Groq key.

import type { OrdersServer, SprintResult, SourceRef, CompetitorEntry } from "@/lib/pipeline-types";
import type { OrderResponse } from "@/lib/types";
import { getSiteFacts, type SiteFacts } from "@/lib/agents/scout";
import { runAnalyst, type AnalystOutput } from "@/lib/agents/analyst";
import { runCopywriter, type CopywriterOutput } from "@/lib/agents/copywriter";
import type { LlmCallFn } from "@/lib/agents/analyst";

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

/**
 * Minimal placeholder renderer used until Codex's real renderer lands.
 *
 * TODO(render-integration): lib/report/render.ts (Codex-owned) will export a
 * `renderReport(result: SprintResult): string` with the polished report
 * template. Once that file exists, swap the call below for a feature-checked
 * dynamic import of it (e.g. `const mod = await import("@/lib/report/render")`
 * guarded by `typeof mod.renderReport === "function"`), falling back to
 * `renderFallback` only if that check fails. We can't wire the import yet:
 * the module doesn't exist, so a static or dynamic import of it today would
 * fail `tsc`/`next build` (module resolution runs at build time, not
 * request time). Keep this function's signature stable so the swap is a
 * one-line change.
 */
export function renderFallback(result: SprintResult): string {
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const competitorRows = result.competitors
    .map(
      (c) => `
        <tr>
          <td>${escapeHtml(c.name)}${c.inference ? " <em>(inferred)</em>" : ""}</td>
          <td>${escapeHtml(c.positioning)}</td>
          <td>${escapeHtml(c.weakness)}</td>
        </tr>`
    )
    .join("");

  const personaItems = result.personas
    .map(
      (p) => `
        <li>
          <strong>${escapeHtml(p.name)}</strong> — pain: ${escapeHtml(p.pain)}; trigger: ${escapeHtml(p.trigger)}
        </li>`
    )
    .join("");

  const outreachItems = result.outreach
    .map(
      (o, i) => `
        <li>
          <strong>${i + 1}. ${escapeHtml(o.angle)}</strong>
          ${o.subject ? `<div><em>Subject: ${escapeHtml(o.subject)}</em></div>` : ""}
          <p>${escapeHtml(o.body)}</p>
        </li>`
    )
    .join("");

  const sourceItems = result.sources
    .map((s) => `<li><a href="${escapeHtml(s.url)}">${escapeHtml(s.url)}</a> (${escapeHtml(s.retrievedAt)})</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Tack Sprint — ${escapeHtml(result.company)}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 20px; color: #111; }
  h1, h2 { color: #111; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
  li { margin-bottom: 12px; }
  .meta { color: #666; font-size: 0.9em; }
</style>
</head>
<body>
  <h1>Tack Sprint — ${escapeHtml(result.company)}</h1>
  <p class="meta">Order ${escapeHtml(result.orderId)} · Generated ${escapeHtml(result.generatedAt)} · Variant ${escapeHtml(result.variantUsed)}</p>

  <h2>Executive summary</h2>
  <p>${escapeHtml(result.execSummary)}</p>

  <h2>Competitor teardown</h2>
  <table>
    <thead><tr><th>Competitor</th><th>Positioning</th><th>Weakness</th></tr></thead>
    <tbody>${competitorRows}</tbody>
  </table>

  <h2>Buyer personas</h2>
  <ul>${personaItems}</ul>

  <h2>Outreach angles</h2>
  <ol>${outreachItems}</ol>

  <h2>Recommended next move</h2>
  <p>${escapeHtml(result.nextMove)}</p>

  <h2>Sources</h2>
  <ul>${sourceItems}</ul>
</body>
</html>`;
}

export interface RunSprintResult {
  sprintResult: SprintResult;
  reportHtml: string;
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
    sources: collectSources(scoutSource, analysis.competitors),
  };

  const reportHtml = renderFallback(sprintResult);

  return { sprintResult, reportHtml };
}
