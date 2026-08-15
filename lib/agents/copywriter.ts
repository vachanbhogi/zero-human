// Copywriter agent: turns the Analyst's competitor teardown + personas into
// two stylistically distinct outreach packages (variant A and variant B),
// each with 10 outreach angles and one recommended next move.
//
// Same Groq chat-completions + forced-JSON approach as the Analyst agent —
// see lib/agents/analyst.ts for the rationale (no SDK, response_format
// json_object + schema-in-prompt, parse-with-one-retry).

import type { OrderResponse } from "@/lib/types";
import type { AnalystOutput } from "@/lib/agents/analyst";
import {
  callGroqChat,
  callJsonWithRetry,
  GROQ_API_URL,
  type LlmCallFn,
} from "@/lib/agents/analyst";

export { GROQ_API_URL };

export const COPYWRITER_MODEL = "llama-3.3-70b-versatile";

export class CopywriterError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "CopywriterError";
  }
}

export interface OutreachAngle {
  angle: string;
  subject?: string;
  body: string;
}

export interface CopywriterVariant {
  outreach: OutreachAngle[];
  nextMove: string;
}

export interface CopywriterOutput {
  A: CopywriterVariant;
  B: CopywriterVariant;
}

export interface CopywriterInput {
  execSummary: AnalystOutput["execSummary"];
  competitors: AnalystOutput["competitors"];
  personas: AnalystOutput["personas"];
  order: Pick<OrderResponse, "url" | "niche" | "company">;
}

export interface CopywriterDeps {
  llmCall?: LlmCallFn;
}

interface VariantSpec {
  key: "A" | "B";
  styleInstructions: string;
}

const VARIANT_SPECS: VariantSpec[] = [
  {
    key: "A",
    styleInstructions: [
      "Style for this variant: direct and metric-led.",
      "- Lead with numbers, timeframes, and concrete outcomes wherever possible.",
      "- Short sentences. No throat-clearing. Get to the point in the first line.",
      "- Frame every angle around a measurable business result (time saved, revenue, conversion lift, cost avoided).",
      "- Subject lines should be specific and unhyped — no clickbait.",
    ].join("\n"),
  },
  {
    key: "B",
    styleInstructions: [
      "Style for this variant: narrative and pain-led.",
      "- Open with the prospect's situation or frustration before introducing the offer.",
      "- Use a short, concrete scenario or observation to build relevance before the ask.",
      "- Focus on the emotional and operational pain of the status quo, not raw metrics.",
      "- Warmer, more conversational tone than variant A, while staying credible and specific.",
    ].join("\n"),
  },
];

const OUTREACH_JSON_SCHEMA = `{
  "outreach": [
    {
      "angle": "One-line label for the angle, e.g. 'Competitor migration'",
      "subject": "Optional cold-email subject line for this angle (may be omitted)",
      "body": "The outreach message body itself, ready to personalize and send"
    }
    // exactly 10 entries
  ],
  "nextMove": "The single highest-leverage next action this company should take this week, in 1-2 sentences"
}`;

function buildSystemPrompt(spec: VariantSpec): string {
  return [
    "You are the Copywriter agent inside Tack Sprint, an automated growth-intelligence pipeline.",
    "You receive the Analyst agent's competitor teardown and buyer personas for a company.",
    "Return ONLY a single JSON object matching exactly this schema (no prose, no markdown fences):",
    OUTREACH_JSON_SCHEMA,
    "The \"outreach\" array must contain EXACTLY 10 entries — no more, no fewer.",
    "",
    spec.styleInstructions,
    "",
    "Rules:",
    "- Each of the 10 angles must be distinct — vary the hook, the persona addressed, and the competitor reference where relevant.",
    "- Ground angles in the specific competitor weaknesses and persona pains provided; do not write generic outreach copy.",
    "- The nextMove must be a single concrete action, not a summary of the angles.",
  ].join("\n");
}

function buildUserContent(input: CopywriterInput): string {
  return JSON.stringify(
    {
      order: {
        url: input.order.url,
        niche: input.order.niche,
        company: input.order.company,
      },
      execSummary: input.execSummary,
      competitors: input.competitors.map((c) => ({
        name: c.name,
        positioning: c.positioning,
        weakness: c.weakness,
      })),
      personas: input.personas,
    },
    null,
    2
  );
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new CopywriterError(`Copywriter output field "${field}" is missing or empty`);
  }
  return value.trim();
}

function validateOutreach(raw: unknown): OutreachAngle[] {
  if (!Array.isArray(raw) || raw.length !== 10) {
    throw new CopywriterError(
      `Copywriter output field "outreach" must contain exactly 10 entries (got ${
        Array.isArray(raw) ? raw.length : typeof raw
      })`
    );
  }
  return raw.map((entry, i) => {
    if (typeof entry !== "object" || entry === null) {
      throw new CopywriterError(`Copywriter outreach[${i}] is not an object`);
    }
    const e = entry as Record<string, unknown>;
    const angle = assertString(e.angle, `outreach[${i}].angle`);
    const body = assertString(e.body, `outreach[${i}].body`);
    const subject =
      typeof e.subject === "string" && e.subject.trim() ? e.subject.trim() : undefined;
    return subject ? { angle, subject, body } : { angle, body };
  });
}

function validateVariantPayload(raw: unknown): CopywriterVariant {
  if (typeof raw !== "object" || raw === null) {
    throw new CopywriterError("Copywriter response was not a JSON object");
  }
  const r = raw as Record<string, unknown>;
  return {
    outreach: validateOutreach(r.outreach),
    nextMove: assertString(r.nextMove, "nextMove"),
  };
}

async function runVariant(
  spec: VariantSpec,
  input: CopywriterInput,
  llmCall: LlmCallFn
): Promise<CopywriterVariant> {
  return callJsonWithRetry(
    {
      model: COPYWRITER_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 4000,
      messages: [
        { role: "system", content: buildSystemPrompt(spec) },
        { role: "user", content: buildUserContent(input) },
      ],
    },
    llmCall,
    validateVariantPayload,
    `Copywriter variant ${spec.key}`
  );
}

export async function runCopywriter(
  input: CopywriterInput,
  deps: CopywriterDeps = {}
): Promise<CopywriterOutput> {
  const llmCall = deps.llmCall ?? callGroqChat;

  const [A, B] = await Promise.all(
    VARIANT_SPECS.map((spec) => runVariant(spec, input, llmCall))
  );

  return { A, B };
}
