import type {
  ClaimKind,
  EvidencedText,
  SprintResult,
  SourceRef,
  TeracResult,
} from "./types";

export interface ClaimViewModel {
  text: string;
  disclosure: { type: "sources"; sourceIds: readonly string[] } | { type: ClaimKind };
}

export interface ReportViewModel {
  company: string;
  generatedAt: string;
  executiveSummary: ClaimViewModel;
  competitors: readonly {
    name: string;
    positioning: ClaimViewModel;
    weakness: ClaimViewModel;
  }[];
  personas: readonly {
    name: string;
    pain: ClaimViewModel;
    trigger: ClaimViewModel;
  }[];
  outreach: readonly {
    position: number;
    angle: ClaimViewModel;
    subject?: ClaimViewModel;
    body: ClaimViewModel;
  }[];
  nextMove: ClaimViewModel;
  sources: readonly SourceRef[];
  terac?: {
    studyId: string;
    completedAt: string;
    metric: string;
    aScore: number;
    bScore: number;
    winner: "A" | "B";
  };
}

export class ReportRenderValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid sprint result: ${issues.join("; ")}`);
    this.name = "ReportRenderValidationError";
    this.issues = issues;
  }
}

function requiredText(value: string, field: string, issues: string[]): string {
  const normalized = value.trim();
  if (!normalized) issues.push(`${field} is required`);
  if (value.includes("\0")) issues.push(`${field} contains a null character`);
  return normalized;
}

function validIso(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function readSources(sources: readonly SourceRef[], issues: string[]): Map<string, SourceRef> {
  const byId = new Map<string, SourceRef>();

  for (const source of sources) {
    const id = requiredText(source.id, "source.id", issues);
    if (byId.has(id)) issues.push(`source ${id} is duplicated`);
    try {
      const url = new URL(source.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        issues.push(`source ${id} has an invalid URL protocol`);
      }
    } catch {
      issues.push(`source ${id} has an invalid URL`);
    }
    if (!validIso(source.retrievedAt)) issues.push(`source ${id} has an invalid retrieval time`);
    byId.set(id, source);
  }

  return byId;
}

function claimView(
  claim: EvidencedText,
  field: string,
  sources: ReadonlyMap<string, SourceRef>,
  issues: string[],
): ClaimViewModel {
  const text = requiredText(claim.text, field, issues);
  const sourceIds = claim.sourceIds?.map((id) => requiredText(id, `${field}.sourceId`, issues)) ?? [];

  if (sourceIds.length > 0) {
    for (const sourceId of sourceIds) {
      if (!sources.has(sourceId)) issues.push(`${field} refers to unknown source ${sourceId}`);
    }
    return { text, disclosure: { type: "sources", sourceIds } };
  }

  if (claim.kind === "inference" || claim.kind === "recommendation") {
    return { text, disclosure: { type: claim.kind } };
  }

  issues.push(`${field} needs source IDs or an inference/recommendation label`);
  return { text, disclosure: { type: "inference" } };
}

function teracView(terac: TeracResult | undefined, issues: string[]): ReportViewModel["terac"] {
  if (!terac || terac.status !== "completed") return undefined;

  const studyId = requiredText(terac.studyId, "terac.studyId", issues);
  const metric = requiredText(terac.metric, "terac.metric", issues);
  if (!validIso(terac.completedAt)) issues.push("terac.completedAt is invalid");
  if (!Number.isFinite(terac.aScore) || !Number.isFinite(terac.bScore)) {
    issues.push("terac scores must be finite numbers");
  }

  return {
    studyId,
    completedAt: terac.completedAt,
    metric,
    aScore: terac.aScore,
    bScore: terac.bScore,
    winner: terac.winner,
  };
}

export function renderReport(result: SprintResult): ReportViewModel {
  const issues: string[] = [];
  const sources = readSources(result.sources, issues);
  const company = requiredText(result.company, "company", issues);
  if (!validIso(result.generatedAt)) issues.push("generatedAt is invalid");
  if (result.outreach.length !== 10) {
    issues.push(`outreach must contain exactly 10 plays, received ${result.outreach.length}`);
  }

  const model: ReportViewModel = {
    company,
    generatedAt: result.generatedAt,
    executiveSummary: claimView(result.executiveSummary, "executiveSummary", sources, issues),
    competitors: result.competitors.map((competitor, index) => ({
      name: requiredText(competitor.name, `competitors[${index}].name`, issues),
      positioning: claimView(competitor.positioning, `competitors[${index}].positioning`, sources, issues),
      weakness: claimView(competitor.weakness, `competitors[${index}].weakness`, sources, issues),
    })),
    personas: result.personas.map((persona, index) => ({
      name: requiredText(persona.name, `personas[${index}].name`, issues),
      pain: claimView(persona.pain, `personas[${index}].pain`, sources, issues),
      trigger: claimView(persona.trigger, `personas[${index}].trigger`, sources, issues),
    })),
    outreach: result.outreach.map((play, index) => ({
      position: index + 1,
      angle: claimView(play.angle, `outreach[${index}].angle`, sources, issues),
      ...(play.subject
        ? { subject: claimView(play.subject, `outreach[${index}].subject`, sources, issues) }
        : {}),
      body: claimView(play.body, `outreach[${index}].body`, sources, issues),
    })),
    nextMove: claimView(result.nextMove, "nextMove", sources, issues),
    sources: result.sources.map((source) => ({ ...source })),
    terac: teracView(result.terac, issues),
  };

  if (issues.length > 0) throw new ReportRenderValidationError(issues);
  return model;
}
