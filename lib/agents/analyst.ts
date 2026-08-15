// Analyst agent: turns a scanned site profile + order intake fields into a
// competitor teardown, positioning summary, and buyer personas.
//
// Calls Groq's OpenAI-compatible chat completions endpoint directly over
// fetch (no SDK dependency, per project constraints) — same provider and
// request shape as the existing lib/groq-discovery.ts (Vachan's file; not
// modified here, only followed for style). JSON is forced via
// `response_format: { type: "json_object" }` plus a system prompt that
// spells out the exact schema, then parsed with JSON.parse and validated;
// a single retry is attempted if parsing/validation fails.

import type { OrderResponse, ScannedProfile } from "@/lib/types";
import type { CompetitorEntry, SourceRef } from "@/lib/pipeline-types";

export const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
export const ANALYST_MODEL = "llama-3.3-70b-versatile";
const REQUEST_TIMEOUT_MS = 30_000;

export class AnalystError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "AnalystError";
  }
}

// --- Minimal raw wire types for the Groq (OpenAI-compatible) chat API ----

export interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatRequest {
  model: string;
  messages: GroqChatMessage[];
  response_format?: { type: "json_object" };
  temperature?: number;
  max_tokens?: number;
}

export interface GroqChatResponse {
  choices: { message: { role: string; content: string } }[];
  [key: string]: unknown;
}

export type LlmCallFn = (request: GroqChatRequest) => Promise<GroqChatResponse>;

/** Default LLM call: raw fetch against the Groq chat completions endpoint. */
export async function callGroqChat(request: GroqChatRequest): Promise<GroqChatResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AnalystError("GROQ_API_KEY is not set");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new AnalystError(
      aborted
        ? `Groq request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : `Request to Groq API failed: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AnalystError(`Groq API responded ${res.status}: ${text.slice(0, 500)}`);
  }

  return (await res.json()) as GroqChatResponse;
}

/**
 * Calls the LLM and parses+validates its JSON content, retrying once (a
 * fresh call, not just a re-parse) if the first attempt fails to parse or
 * fails validation.
 */
export async function callJsonWithRetry<T>(
  request: GroqChatRequest,
  llmCall: LlmCallFn,
  validate: (raw: unknown) => T,
  errorLabel: string
): Promise<T> {
  const attempt = async (): Promise<T> => {
    const response = await llmCall(request);
    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new AnalystError(`${errorLabel}: response had no message content`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      throw new AnalystError(
        `${errorLabel}: failed to parse JSON response: ${err instanceof Error ? err.message : String(err)}`,
        err
      );
    }

    return validate(parsed);
  };

  try {
    return await attempt();
  } catch {
    // One retry on parse/validation failure, per spec.
    return await attempt();
  }
}

// --- Public analyst contract -----------------------------------------------

export interface AnalystInput {
  profile: ScannedProfile;
  source: SourceRef;
  order: Pick<
    OrderResponse,
    "url" | "niche" | "company" | "audience" | "competitors" | "focus" | "stage"
  >;
}

export interface AnalystOutput {
  execSummary: string;
  competitors: CompetitorEntry[];
  personas: { name: string; pain: string; trigger: string }[];
}

export interface AnalystDeps {
  llmCall?: LlmCallFn;
}

const ANALYSIS_JSON_SCHEMA = `{
  "execSummary": "2-4 sentence plain-English summary of the company's current positioning and the biggest growth opportunity",
  "competitors": [
    {
      "name": "Competitor company name",
      "positioning": "How this competitor positions itself in the market",
      "weakness": "A concrete, exploitable weakness or gap in this competitor's offering"
    }
    // 2 to 5 entries
  ],
  "personas": [
    {
      "name": "Persona label, e.g. 'VP of Growth'",
      "pain": "The core pain point this persona feels",
      "trigger": "The event or moment that makes this persona receptive to outreach right now"
    }
    // 2 to 4 entries
  ]
}`;

function buildSystemPrompt(): string {
  return [
    "You are the Analyst agent inside Tack Sprint, an automated growth-intelligence pipeline.",
    "You receive a scanned profile of a company's website plus intake details from the paying customer.",
    "Return ONLY a single JSON object matching exactly this schema (no prose, no markdown fences):",
    ANALYSIS_JSON_SCHEMA,
    "",
    "Rules:",
    "- If a competitor name appears in the provided 'knownCompetitors' list (sourced from the site scan or the customer's own input), treat it as a confirmed competitor.",
    "- You may add additional competitors from your own general knowledge of the space when useful, beyond the known list.",
    "- Every competitor needs a specific, concrete weakness — avoid generic filler like 'expensive' with no detail.",
    "- Personas should reflect real buying roles for this company's niche, not generic titles.",
    "- Keep the exec summary concrete and specific to this company; do not restate the prompt.",
  ].join("\n");
}

function buildUserContent(input: AnalystInput, knownCompetitorNames: string[]): string {
  return JSON.stringify(
    {
      order: {
        url: input.order.url,
        niche: input.order.niche,
        company: input.order.company,
        audience: input.order.audience,
        customerSuppliedCompetitors: input.order.competitors,
        focus: input.order.focus,
        stage: input.order.stage,
      },
      scannedProfile: input.profile,
      knownCompetitors: knownCompetitorNames,
    },
    null,
    2
  );
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AnalystError(`Analyst output field "${field}" is missing or empty`);
  }
  return value.trim();
}

/**
 * Reconciles the model's competitor list against what Scout actually
 * retrieved. This is enforced in code rather than trusted from the model:
 * any competitor whose name doesn't match a known/retrieved name is marked
 * `inference: true` with an empty `sources` array, regardless of what the
 * model claimed.
 */
function reconcileCompetitors(
  raw: unknown,
  knownNames: Set<string>,
  source: SourceRef
): CompetitorEntry[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new AnalystError("Analyst output field \"competitors\" is missing or empty");
  }

  return raw.map((entry, i) => {
    if (typeof entry !== "object" || entry === null) {
      throw new AnalystError(`Analyst competitors[${i}] is not an object`);
    }
    const e = entry as Record<string, unknown>;
    const name = assertString(e.name, `competitors[${i}].name`);
    const positioning = assertString(e.positioning, `competitors[${i}].positioning`);
    const weakness = assertString(e.weakness, `competitors[${i}].weakness`);

    const isKnown = knownNames.has(name.toLowerCase());
    if (isKnown) {
      return {
        name,
        positioning,
        weakness,
        sources: [source],
        inference: false,
      };
    }
    return {
      name,
      positioning,
      weakness,
      sources: [],
      inference: true,
    };
  });
}

function validatePersonas(raw: unknown): { name: string; pain: string; trigger: string }[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new AnalystError("Analyst output field \"personas\" is missing or empty");
  }
  return raw.map((entry, i) => {
    if (typeof entry !== "object" || entry === null) {
      throw new AnalystError(`Analyst personas[${i}] is not an object`);
    }
    const e = entry as Record<string, unknown>;
    return {
      name: assertString(e.name, `personas[${i}].name`),
      pain: assertString(e.pain, `personas[${i}].pain`),
      trigger: assertString(e.trigger, `personas[${i}].trigger`),
    };
  });
}

function validateAnalysisPayload(
  raw: unknown,
  knownCompetitorNames: Set<string>,
  source: SourceRef
): AnalystOutput {
  if (typeof raw !== "object" || raw === null) {
    throw new AnalystError("Analyst response was not a JSON object");
  }
  const r = raw as Record<string, unknown>;
  return {
    execSummary: assertString(r.execSummary, "execSummary"),
    competitors: reconcileCompetitors(r.competitors, knownCompetitorNames, source),
    personas: validatePersonas(r.personas),
  };
}

export async function runAnalyst(
  input: AnalystInput,
  deps: AnalystDeps = {}
): Promise<AnalystOutput> {
  const llmCall = deps.llmCall ?? callGroqChat;

  const knownCompetitorNames = new Set(
    [...(input.profile.competitors ?? []), ...(input.order.competitors ?? [])]
      .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
      .map((name) => name.toLowerCase().trim())
  );

  return callJsonWithRetry(
    {
      model: ANALYST_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 4000,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserContent(input, [...knownCompetitorNames]) },
      ],
    },
    llmCall,
    (raw) => validateAnalysisPayload(raw, knownCompetitorNames, input.source),
    "Analyst"
  );
}
