/**
 * Typed client for the Terac external API v2 human-preference studies.
 *
 * Docs consulted (2026-08-15):
 *   https://terac.com/docs/developers/reference/createOpportunity
 *   https://terac.com/docs/developers/reference/launchOpportunity
 *   https://terac.com/docs/developers/reference/getOpportunity
 *   https://terac.com/docs/developers/reference/listSubmissions
 *   https://terac.com/docs/developers/guides/screening-questions
 *
 * Task type choice: the reference docs do not enumerate `task_type` values
 * and do not document a dedicated "survey" task type. The only documented
 * example uses task_type "interview" with review_type "auto_approve", so
 * that is used here for the required `tasks` entry (participants read the
 * two variants and then answer a question).
 *
 * The actual A/B preference vote is NOT collected via task_type. It is
 * collected via a `screening_questions` entry with `pick: "one"` and
 * `qualify_logic: "may"` on both answers. The screening-questions guide
 * confirms "may" is neutral (does not affect qualification) and that
 * pick/text questions can be used purely for data collection, not just
 * applicant screening. Submissions return the participant's choice in
 * `screening_answers[].answer`, keyed by PREFERENCE_QUESTION_KEY.
 *
 * ZERO SPEND: only createDraftStudy() and the read-only calls (listProjects,
 * getOpportunity, listSubmissions) may be called freely. launchStudy() is
 * hard-gated on process.env.LAUNCH_APPROVED === "yes" and must additionally
 * be gated by callers (see scripts/terac-study.mjs) behind an explicit
 * --launch CLI flag. No other function in this file calls the launch
 * endpoint.
 */

const API_BASE = "https://terac.com/api/external/v2";

export const PREFERENCE_QUESTION_KEY = "preference";
export const VARIANT_A_PREFIX = "Variant A:";
export const VARIANT_B_PREFIX = "Variant B:";
export const PREFERENCE_QUESTION_TEXT =
  "Which of these two startup growth pitches is more actionable and specific?";

/** RFC 2606 reserved placeholder domain. Replace with a real hosted comparison page before ever launching. */
const PLACEHOLDER_TASK_URL = "https://example.com/tack-terac-study/variant-comparison";

export interface TeracProject {
  id: string;
  name: string;
  slug: string;
  dashboard_url: string;
}

export interface TeracPagination {
  next_cursor?: string | null;
  has_more?: boolean;
}

export interface TeracTask {
  sequence: number;
  task_type: string;
  review_type: string;
  task_url: string;
  participant_url_template?: string;
  title?: string;
  description?: string;
  duration_minutes: number;
}

export type QualifyLogic = "may" | "must" | "must_one_of" | "reject" | "review";

export interface ScreeningAnswerOption {
  text: string;
  qualify_logic: QualifyLogic;
  allow_free_text?: boolean;
}

export interface ScreeningQuestion {
  key: string;
  text: string;
  pick: "one" | "any" | "boolean" | "text" | "grid";
  answers?: ScreeningAnswerOption[];
}

export interface CreateOpportunityBody {
  title: string;
  project_id: string;
  num_participants: number;
  business_type: "b2c" | "b2b";
  description?: string;
  tasks: TeracTask[];
  screening_questions?: ScreeningQuestion[];
  unrestricted_audience?: boolean;
  device_types?: string[];
  expected_days_to_complete?: number;
  internal_title?: string;
}

export interface TeracOpportunity {
  id: string;
  title: string;
  status: string;
  project_id: string;
  dashboard_url?: string;
  cost_per_participant_cents?: number;
  total_cost_cents?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface ScreeningAnswer {
  key: string;
  question: string;
  answer: string[];
  outcome: string;
}

export interface TeracSubmission {
  id: string;
  opportunity_id?: string;
  status: string;
  participant_id?: string;
  created_at?: string;
  updated_at?: string;
  screening_outcome?: string;
  screening_answers?: ScreeningAnswer[];
  [key: string]: unknown;
}

export interface StudyAggregate {
  aVotes: number;
  bVotes: number;
  total: number;
  winner: "A" | "B" | "tie" | "none";
  metric: "preference";
}

export interface CreateDraftStudyParams {
  projectId: string;
  title: string;
  variantA: string;
  variantB: string;
  participants?: number;
  businessType?: "b2c" | "b2b";
  taskUrl?: string;
  durationMinutes?: number;
  internalTitle?: string;
}

function getApiKey(): string {
  const key = process.env.TERAC_API_KEY;
  if (!key) {
    throw new Error(
      "TERAC_API_KEY is not set. Add it to .env.local (see .env.example) and re-run.",
    );
  }
  return key;
}

async function teracFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = getApiKey();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object" && body !== null && "message" in body
        ? String((body as Record<string, unknown>).message)
        : res.statusText;
    throw new Error(
      `Terac API ${init.method ?? "GET"} ${path} failed: ${res.status} ${message}`,
    );
  }

  return body as T;
}

/** GET /projects (read-only, free). */
export async function listProjects(): Promise<{
  data: TeracProject[];
  pagination: TeracPagination;
}> {
  return teracFetch("/projects");
}

/** GET /opportunities/{id} (read-only, free). */
export async function getOpportunity(id: string): Promise<TeracOpportunity> {
  return teracFetch(`/opportunities/${encodeURIComponent(id)}`);
}

/** Builds the preference screening question. Both answers use qualify_logic "may" so the
 * question is pure data collection and never disqualifies a participant. */
export function buildPreferenceQuestion(
  variantA: string,
  variantB: string,
): ScreeningQuestion {
  return {
    key: PREFERENCE_QUESTION_KEY,
    text: PREFERENCE_QUESTION_TEXT,
    pick: "one",
    answers: [
      { text: `${VARIANT_A_PREFIX} ${variantA}`, qualify_logic: "may" },
      { text: `${VARIANT_B_PREFIX} ${variantB}`, qualify_logic: "may" },
    ],
  };
}

/** Pure function: builds the exact POST /opportunities request body. No network call. */
export function buildCreateOpportunityBody(
  params: CreateDraftStudyParams,
): CreateOpportunityBody {
  const {
    projectId,
    title,
    variantA,
    variantB,
    participants = 5,
    businessType = "b2c",
    taskUrl,
    durationMinutes = 3,
    internalTitle,
  } = params;

  if (!projectId) throw new Error("projectId is required");
  if (!title || title.length > 200) {
    throw new Error("title is required and must be <= 200 chars");
  }
  if (!variantA?.trim() || !variantB?.trim()) {
    throw new Error("variantA and variantB are required");
  }
  if (!Number.isInteger(participants) || participants < 1) {
    throw new Error("participants must be a positive integer");
  }

  const description = [
    "Compare two startup outreach copy variants and pick the one that reads as more actionable and specific.",
    "",
    `Variant A: ${variantA}`,
    "",
    `Variant B: ${variantB}`,
  ]
    .join("\n")
    .slice(0, 5000);

  return {
    title,
    project_id: projectId,
    num_participants: participants,
    business_type: businessType,
    description,
    tasks: [
      {
        sequence: 1,
        task_type: "interview",
        review_type: "auto_approve",
        task_url: taskUrl ?? PLACEHOLDER_TASK_URL,
        title: "Review two growth pitch variants",
        description:
          "Read Variant A and Variant B, then answer the preference question below.",
        duration_minutes: durationMinutes,
      },
    ],
    screening_questions: [buildPreferenceQuestion(variantA, variantB)],
    unrestricted_audience: true,
    ...(internalTitle ? { internal_title: internalTitle } : {}),
  };
}

/** POST /opportunities. Creates a DRAFT opportunity only. Never spends money. */
export async function createDraftStudy(
  params: CreateDraftStudyParams,
): Promise<TeracOpportunity> {
  const body = buildCreateOpportunityBody(params);
  if (body.tasks[0]?.task_url === PLACEHOLDER_TASK_URL) {
    console.warn(
      "[terac] Using placeholder task_url (example.com). Replace with a real hosted " +
        "comparison page before ever launching this study.",
    );
  }
  return teracFetch("/opportunities", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * POST /opportunities/{id}/launch. SPENDS MONEY.
 * Hard-gated: throws unless LAUNCH_APPROVED=yes is set in the environment.
 * Callers (CLI) must additionally require an explicit --launch flag before
 * ever calling this function.
 */
export async function launchStudy(id: string): Promise<TeracOpportunity> {
  if (process.env.LAUNCH_APPROVED !== "yes") {
    throw new Error(
      "Refusing to launch: set LAUNCH_APPROVED=yes to confirm this will spend real " +
        "participant compensation. This is in addition to any CLI --launch flag.",
    );
  }
  return teracFetch(`/opportunities/${encodeURIComponent(id)}/launch`, {
    method: "POST",
  });
}

export interface ListSubmissionsParams {
  limit?: number;
  cursor?: string;
  status?: string;
}

/** GET /opportunities/{id}/submissions (read-only, free). */
export async function listSubmissions(
  id: string,
  params: ListSubmissionsParams = {},
): Promise<{
  data: TeracSubmission[];
  pagination: TeracPagination;
  dashboard_url?: string;
}> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return teracFetch(
    `/opportunities/${encodeURIComponent(id)}/submissions${qs ? `?${qs}` : ""}`,
  );
}

/** Aggregates the A-vs-B preference vote out of a list of submissions. Pure function. */
export function aggregateResults(submissions: TeracSubmission[]): StudyAggregate {
  let aVotes = 0;
  let bVotes = 0;

  for (const submission of submissions) {
    const answer = submission.screening_answers?.find(
      (a) => a.key === PREFERENCE_QUESTION_KEY,
    );
    const choice = answer?.answer?.[0];
    if (typeof choice !== "string") continue;
    if (choice.startsWith(VARIANT_A_PREFIX)) aVotes += 1;
    else if (choice.startsWith(VARIANT_B_PREFIX)) bVotes += 1;
  }

  const total = aVotes + bVotes;
  const winner: StudyAggregate["winner"] =
    total === 0 ? "none" : aVotes === bVotes ? "tie" : aVotes > bVotes ? "A" : "B";

  return { aVotes, bVotes, total, winner, metric: "preference" };
}
