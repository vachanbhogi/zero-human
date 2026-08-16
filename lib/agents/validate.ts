// Validates a fully-assembled SprintResult before it is ever persisted, per
// CONTRACT.md v2 section 5. The pipeline must refuse to persist an invalid
// result — see lib/agents/pipeline.ts, which calls this and lets a thrown
// ValidationError propagate up to app/api/run/route.ts's failOrder path
// rather than ever reaching OrdersServer.completeOrder.

import type { SprintResult } from "@/lib/pipeline-types";

export class ValidationError extends Error {
  /** All individual reasons the result was rejected, not just the first. */
  reasons: string[];

  constructor(reasons: string[]) {
    super(`SprintResult failed validation: ${reasons.join("; ")}`);
    this.name = "ValidationError";
    this.reasons = reasons;
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates a SprintResult against CONTRACT.md v2 section 5:
 *   - exactly 10 outreach items
 *   - every competitor carries sources[] (non-empty) OR inference === true
 *   - terac.status is "not_run" by default; if "completed", studyId,
 *     aScore, bScore, and metric are all required together
 *
 * Throws ValidationError (with every reason, not just the first) if the
 * result is invalid. Returns void on success.
 */
export function validateSprintResult(result: SprintResult): void {
  const reasons: string[] = [];

  if (!Array.isArray(result.outreach)) {
    reasons.push("outreach must be an array");
  } else if (result.outreach.length !== 10) {
    reasons.push(`outreach must contain exactly 10 items (got ${result.outreach.length})`);
  } else {
    result.outreach.forEach((item, i) => {
      if (!isNonEmptyString(item?.angle)) reasons.push(`outreach[${i}].angle is missing`);
      if (!isNonEmptyString(item?.body)) reasons.push(`outreach[${i}].body is missing`);
    });
  }

  if (!Array.isArray(result.competitors) || result.competitors.length === 0) {
    reasons.push("competitors must be a non-empty array");
  } else {
    result.competitors.forEach((c, i) => {
      const hasSources = Array.isArray(c?.sources) && c.sources.length > 0;
      const isInference = c?.inference === true;
      if (!hasSources && !isInference) {
        reasons.push(
          `competitors[${i}] ("${c?.name ?? "unknown"}") must carry a non-empty sources[] or inference: true`
        );
      }
      // An inference competitor claiming sources anyway would be a
      // contradictory/misleading claim about provenance.
      if (isInference && Array.isArray(c?.sources) && c.sources.length > 0) {
        reasons.push(
          `competitors[${i}] ("${c?.name ?? "unknown"}") is marked inference: true but also carries sources[]`
        );
      }
    });
  }

  const terac = result.terac as { status?: unknown } | undefined;
  if (!terac || typeof terac !== "object") {
    reasons.push('terac is required and must be an object (default: { status: "not_run" })');
  } else if (terac.status === "not_run") {
    // No further fields required.
  } else if (terac.status === "completed") {
    const t = terac as Record<string, unknown>;
    if (!isNonEmptyString(t.studyId)) reasons.push("terac.studyId is required when status is \"completed\"");
    if (typeof t.aScore !== "number" || Number.isNaN(t.aScore)) {
      reasons.push("terac.aScore is required (number) when status is \"completed\"");
    }
    if (typeof t.bScore !== "number" || Number.isNaN(t.bScore)) {
      reasons.push("terac.bScore is required (number) when status is \"completed\"");
    }
    if (!isNonEmptyString(t.metric)) reasons.push("terac.metric is required when status is \"completed\"");
  } else {
    reasons.push(`terac.status must be "not_run" or "completed" (got ${JSON.stringify(terac.status)})`);
  }

  if (!isNonEmptyString(result.orderId)) reasons.push("orderId is missing");
  if (!isNonEmptyString(result.company)) reasons.push("company is missing");
  if (!isNonEmptyString(result.execSummary)) reasons.push("execSummary is missing");
  if (!isNonEmptyString(result.nextMove)) reasons.push("nextMove is missing");
  if (!Array.isArray(result.personas) || result.personas.length === 0) {
    reasons.push("personas must be a non-empty array");
  }

  if (reasons.length > 0) {
    throw new ValidationError(reasons);
  }
}
