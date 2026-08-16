import type { SourceRef, SprintResult } from "../pipeline-types";

type UnknownRecord = Record<string, unknown>;

export interface ClaimViewModel {
  text: string;
  disclosure: { type: "sources"; sources: readonly SourceRef[] } | { type: "inference" };
}

export interface ReportViewModel {
  company: string;
  generatedAt: string;
  execSummary: string;
  competitors: readonly { name: string; positioning: ClaimViewModel; weakness: ClaimViewModel }[];
  personas: readonly { name: string; pain: string; trigger: string }[];
  outreach: readonly { position: number; angle: string; subject?: string; body: string }[];
  nextMove: string;
  sources: readonly SourceRef[];
  terac?: { studyId: string; metric: string; aScore: number; bScore: number };
}

export class ReportRenderValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid sprint result: ${issues.join("; ")}`);
    this.name = "ReportRenderValidationError";
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown, field: string, issues: string[]): UnknownRecord {
  if (isRecord(value)) return value;
  issues.push(`${field} must be an object`);
  return {};
}

function array(value: unknown, field: string, issues: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  issues.push(`${field} must be an array`);
  return [];
}

function requiredText(value: unknown, field: string, issues: string[]): string {
  if (typeof value !== "string") {
    issues.push(`${field} must be a string`);
    return "";
  }
  if (!value.trim()) issues.push(`${field} is required`);
  if (value.includes("\0")) issues.push(`${field} contains a null character`);
  return value;
}

function validIso(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, offsetHour, offsetMinute] = match;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const maxDay = monthNumber >= 1 && monthNumber <= 12
    ? new Date(Date.UTC(yearNumber, monthNumber, 0)).getUTCDate()
    : 0;
  return yearNumber >= 1 && dayNumber >= 1 && dayNumber <= maxDay && Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59 && (offsetHour === undefined || (Number(offsetHour) <= 14 && Number(offsetMinute) <= 59));
}

function sourceKey(source: SourceRef): string {
  return `${source.url}\n${source.retrievedAt}`;
}

function sources(value: unknown, field: string, issues: string[]): SourceRef[] {
  return array(value, field, issues).map((item, index) => {
    const source = record(item, `${field}[${index}]`, issues);
    const url = requiredText(source.url, `${field}[${index}].url`, issues);
    const retrievedAt = requiredText(source.retrievedAt, `${field}[${index}].retrievedAt`, issues);
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") issues.push(`${field}[${index}].url has an invalid URL protocol`);
    } catch {
      issues.push(`${field}[${index}].url is invalid`);
    }
    if (!validIso(retrievedAt)) issues.push(`${field}[${index}].retrievedAt must be an ISO-8601 timestamp`);
    return { url, retrievedAt };
  });
}

function competitorClaim(
  value: unknown,
  field: string,
  competitorSources: readonly SourceRef[],
  inference: boolean,
  sourceKeys: ReadonlySet<string>,
  issues: string[],
): ClaimViewModel {
  const text = requiredText(value, field, issues);
  if (competitorSources.length === 0 && !inference) issues.push(`${field} needs sources or inference: true`);
  for (const source of competitorSources) {
    if (!sourceKeys.has(sourceKey(source))) issues.push(`${field} refers to a source not present in sources`);
  }
  return competitorSources.length > 0
    ? { text, disclosure: { type: "sources", sources: competitorSources } }
    : { text, disclosure: { type: "inference" } };
}

function teracView(value: unknown, issues: string[]): ReportViewModel["terac"] {
  const terac = record(value, "terac", issues);
  if (terac.status === "not_run") return undefined;
  if (terac.status !== "completed") {
    issues.push('terac.status must be "not_run" or "completed"');
    return undefined;
  }
  const studyId = requiredText(terac.studyId, "terac.studyId", issues);
  const metric = requiredText(terac.metric, "terac.metric", issues);
  if (typeof terac.aScore !== "number" || !Number.isFinite(terac.aScore) || typeof terac.bScore !== "number" || !Number.isFinite(terac.bScore)) {
    issues.push("terac scores must be finite numbers");
  }
  return {
    studyId,
    metric,
    aScore: typeof terac.aScore === "number" ? terac.aScore : Number.NaN,
    bScore: typeof terac.bScore === "number" ? terac.bScore : Number.NaN,
  };
}

export function renderReport(storedResult: unknown): ReportViewModel {
  const issues: string[] = [];
  const result = record(storedResult, "result", issues);
  const reportSources = sources(result.sources, "sources", issues);
  const sourceKeys = new Set(reportSources.map(sourceKey));
  if (sourceKeys.size !== reportSources.length) issues.push("sources contains duplicates");
  const outreach = array(result.outreach, "outreach", issues);
  if (outreach.length !== 10) issues.push(`outreach must contain exactly 10 plays, received ${outreach.length}`);
  if (result.variantUsed !== "A" && result.variantUsed !== "B") issues.push('variantUsed must be "A" or "B"');

  const model: ReportViewModel = {
    company: requiredText(result.company, "company", issues),
    generatedAt: requiredText(result.generatedAt, "generatedAt", issues),
    execSummary: requiredText(result.execSummary, "execSummary", issues),
    competitors: array(result.competitors, "competitors", issues).map((entry, index) => {
      const competitor = record(entry, `competitors[${index}]`, issues);
      const competitorSources = sources(competitor.sources, `competitors[${index}].sources`, issues);
      if (competitor.inference !== undefined && typeof competitor.inference !== "boolean") issues.push(`competitors[${index}].inference must be a boolean`);
      return {
        name: requiredText(competitor.name, `competitors[${index}].name`, issues),
        positioning: competitorClaim(competitor.positioning, `competitors[${index}].positioning`, competitorSources, competitor.inference === true, sourceKeys, issues),
        weakness: competitorClaim(competitor.weakness, `competitors[${index}].weakness`, competitorSources, competitor.inference === true, sourceKeys, issues),
      };
    }),
    personas: array(result.personas, "personas", issues).map((entry, index) => {
      const persona = record(entry, `personas[${index}]`, issues);
      return {
        name: requiredText(persona.name, `personas[${index}].name`, issues),
        pain: requiredText(persona.pain, `personas[${index}].pain`, issues),
        trigger: requiredText(persona.trigger, `personas[${index}].trigger`, issues),
      };
    }),
    outreach: outreach.map((entry, index) => {
      const play = record(entry, `outreach[${index}]`, issues);
      return {
        position: index + 1,
        angle: requiredText(play.angle, `outreach[${index}].angle`, issues),
        ...(play.subject === undefined ? {} : { subject: requiredText(play.subject, `outreach[${index}].subject`, issues) }),
        body: requiredText(play.body, `outreach[${index}].body`, issues),
      };
    }),
    nextMove: requiredText(result.nextMove, "nextMove", issues),
    sources: reportSources,
    terac: teracView(result.terac, issues),
  };

  requiredText(result.orderId, "orderId", issues);
  if (!validIso(model.generatedAt)) issues.push("generatedAt must be an ISO-8601 timestamp");
  if (issues.length > 0) throw new ReportRenderValidationError(issues);
  return model;
}
