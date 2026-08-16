#!/usr/bin/env node
/**
 * Terac human-preference study CLI for Tack.
 *
 * ZERO SPEND by construction:
 *   - `draft` only ever calls POST /opportunities (creates a DRAFT, no spend),
 *     and only when --live is passed. `--dry-run` prints the exact request
 *     body without any network call.
 *   - `status` and `results` only call read-only GET endpoints.
 *   - `launch` is the ONLY subcommand that can call POST /opportunities/{id}/launch,
 *     and it refuses to run unless BOTH the --launch CLI flag AND the
 *     LAUNCH_APPROVED=yes environment variable are present. lib/terac/study.ts's
 *     launchStudy() re-checks LAUNCH_APPROVED independently, so both gates must
 *     agree before any money can be spent.
 *
 * Run with plain node (no build step, no extra deps): Node's built-in
 * TypeScript type-stripping (available in this repo's Node runtime) lets
 * this .mjs file import lib/terac/study.ts and lib/terac/evidence.ts directly.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  buildCreateOpportunityBody,
  createDraftStudy,
  getOpportunity,
  launchStudy,
  listSubmissions,
  aggregateResults,
  VARIANT_A_PREFIX,
  VARIANT_B_PREFIX,
} from "../lib/terac/study.ts";
import { writeEvidence } from "../lib/terac/evidence.ts";

// "Default project" per verified API facts (GET /projects). Override with TERAC_PROJECT_ID.
const DEFAULT_PROJECT_ID = "kg6ixr5u635a7xwdbl7zfrlb";
const DEFAULT_PARTICIPANTS = 5;

// Sample copy variants for the one real study this CLI is built to run:
// "which variant is more actionable/specific for startup outreach".
const SAMPLE_VARIANT_A =
  "Hi {{first_name}}, saw {{company}} just closed a seed round, congrats. We help " +
  "newly-funded teams turn that momentum into qualified sales calls within 30 days, " +
  "using a repeatable outbound system rather than another growth hack. Worth a " +
  "15-minute look this week?";
const SAMPLE_VARIANT_B =
  "Hey {{first_name}}, growth at teams like {{company}} often stalls right after " +
  "funding because outbound isn't systemized yet. We build a done-for-you outbound " +
  "engine that books qualified meetings on autopilot. Want the one-page breakdown?";

async function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  let raw;
  try {
    raw = await readFile(envPath, "utf8");
  } catch {
    return; // no .env.local in this cwd; rely on already-exported env vars
  }

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const flags = new Set();
  const positional = [];
  for (const arg of argv) {
    if (arg.startsWith("--")) flags.add(arg.slice(2));
    else positional.push(arg);
  }
  return { flags, positional };
}

function usage() {
  console.log(`Terac study CLI (zero-spend by default)

Usage:
  node scripts/terac-study.mjs draft --dry-run
      Print the exact POST /opportunities request body. No network call.

  node scripts/terac-study.mjs draft --live
      Create a DRAFT opportunity (free; does not launch or spend money).
      Prints the opportunity id, dashboard URL, and any cost estimate fields
      the API returns for the draft.

  node scripts/terac-study.mjs status <opportunity-id>
      GET the opportunity (read-only, free).

  node scripts/terac-study.mjs results <opportunity-id>
      List submissions, aggregate the A-vs-B preference vote, and write
      sanitized evidence to evidence/terac/<opportunity-id>.json.

  node scripts/terac-study.mjs launch <opportunity-id> --launch
      Launch the opportunity. SPENDS REAL MONEY. Requires --launch AND
      LAUNCH_APPROVED=yes in the environment. Refuses otherwise.

Env:
  TERAC_API_KEY       required for any command that calls the API (read from
                       .env.local in the current working directory, or from
                       an already-exported environment variable).
  TERAC_PROJECT_ID    optional override for the target project id.
  LAUNCH_APPROVED     must be exactly "yes" for 'launch' to proceed.
`);
}

function draftParams() {
  return {
    projectId: process.env.TERAC_PROJECT_ID || DEFAULT_PROJECT_ID,
    title: "Tack growth pitch: actionable copy A/B preference",
    variantA: SAMPLE_VARIANT_A,
    variantB: SAMPLE_VARIANT_B,
    participants: DEFAULT_PARTICIPANTS,
    businessType: "b2c",
  };
}

async function cmdDraft(flags) {
  const dryRun = flags.has("dry-run");
  const live = flags.has("live");

  if (!dryRun && !live) {
    console.error(
      "Refusing to run 'draft' without --dry-run or --live.\n" +
        "  --dry-run prints the request body only (no network call).\n" +
        "  --live actually creates a DRAFT opportunity (free, but a real API write).",
    );
    process.exitCode = 1;
    return;
  }

  const params = draftParams();
  const body = buildCreateOpportunityBody(params);

  if (dryRun) {
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const opportunity = await createDraftStudy(params);
  console.log(`Draft opportunity created: ${opportunity.id}`);
  if (opportunity.dashboard_url) console.log(`Dashboard: ${opportunity.dashboard_url}`);
  console.log(`Status: ${opportunity.status}`);
  if (opportunity.cost_per_participant_cents != null) {
    console.log(`cost_per_participant_cents: ${opportunity.cost_per_participant_cents}`);
  }
  if (opportunity.total_cost_cents != null) {
    console.log(`total_cost_cents: ${opportunity.total_cost_cents}`);
  }
  console.log("NOTE: this created a DRAFT only. Nothing was launched; no money was spent.");
}

async function cmdStatus(id) {
  if (!id) throw new Error("status requires an opportunity id");
  const opportunity = await getOpportunity(id);
  console.log(JSON.stringify(opportunity, null, 2));
}

async function cmdResults(id) {
  if (!id) throw new Error("results requires an opportunity id");

  const { data: submissions } = await listSubmissions(id, { limit: 100 });
  const aggregate = aggregateResults(submissions);

  // At most 3 sanitized excerpts of the *copy that was picked*, never participant metadata.
  const excerpts = [];
  for (const submission of submissions) {
    if (excerpts.length >= 3) break;
    const answer = submission.screening_answers?.find((a) => a.key === "preference");
    const choiceText = answer?.answer?.[0];
    if (typeof choiceText !== "string") continue;
    if (choiceText.startsWith(VARIANT_A_PREFIX)) {
      excerpts.push({ choice: "A", excerpt: choiceText.slice(VARIANT_A_PREFIX.length) });
    } else if (choiceText.startsWith(VARIANT_B_PREFIX)) {
      excerpts.push({ choice: "B", excerpt: choiceText.slice(VARIANT_B_PREFIX.length) });
    }
  }

  const filePath = await writeEvidence(id, aggregate, excerpts);
  console.log(JSON.stringify(aggregate, null, 2));
  console.log(`Evidence written: ${filePath}`);
}

async function cmdLaunch(id, flags) {
  if (!id) throw new Error("launch requires an opportunity id");

  if (!flags.has("launch")) {
    console.error(
      "Refusing to launch: pass --launch explicitly.\n" +
        "  Launching spends real participant compensation and is in addition to\n" +
        "  the LAUNCH_APPROVED=yes environment variable requirement.",
    );
    process.exitCode = 1;
    return;
  }
  if (process.env.LAUNCH_APPROVED !== "yes") {
    console.error(
      "Refusing to launch: set LAUNCH_APPROVED=yes in the environment.\n" +
        "  This is in addition to the --launch flag requirement.",
    );
    process.exitCode = 1;
    return;
  }

  const opportunity = await launchStudy(id);
  console.log(JSON.stringify(opportunity, null, 2));
}

async function main() {
  await loadDotEnvLocal();

  const [, , command, ...rest] = process.argv;
  const { flags, positional } = parseArgs(rest);

  switch (command) {
    case "draft":
      await cmdDraft(flags);
      break;
    case "status":
      await cmdStatus(positional[0]);
      break;
    case "results":
      await cmdResults(positional[0]);
      break;
    case "launch":
      await cmdLaunch(positional[0], flags);
      break;
    default:
      usage();
      process.exitCode = command ? 1 : 0;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
