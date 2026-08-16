/**
 * Writes sanitized Terac study evidence to evidence/terac/<studyId>.json.
 *
 * PROJECT.md requires: "Store the study request, returned responses, and
 * resulting change as demonstration evidence" while also requiring that
 * private Terac responses / customer data are never committed. This module
 * reconciles both: it stores aggregated counts (safe) and at most a few
 * short, sanitized excerpts of the *variant copy that was picked* -- never
 * participant identifiers, emails, or demographic data.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StudyAggregate } from "./study";

const EVIDENCE_DIR = path.join(process.cwd(), "evidence", "terac");
const MAX_EXCERPTS = 3;
const MAX_EXCERPT_LENGTH = 240;
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

export interface SanitizedExcerpt {
  /** Which variant the excerpt is drawn from, not which participant chose it. */
  choice: "A" | "B";
  /** Short excerpt of the variant copy. Never participant id, email, or demographic data. */
  excerpt: string;
}

export interface StudyEvidence {
  studyId: string;
  writtenAt: string;
  aggregate: StudyAggregate;
  sampleExcerpts: SanitizedExcerpt[];
}

function sanitizeExcerpt(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_EXCERPT_LENGTH);
}

function assertSafeId(studyId: string): void {
  if (!studyId || !SAFE_ID.test(studyId)) {
    throw new Error(
      `Refusing to write evidence: studyId "${studyId}" must match ${SAFE_ID} (opportunity ids only).`,
    );
  }
}

/**
 * Writes evidence/terac/<studyId>.json with aggregated counts, winner, a
 * timestamp, and at most MAX_EXCERPTS sanitized copy excerpts. Also ensures
 * evidence/terac/README.md exists and documents the sanitization rule.
 * Returns the path written.
 */
export async function writeEvidence(
  studyId: string,
  aggregate: StudyAggregate,
  sampleExcerpts: SanitizedExcerpt[] = [],
): Promise<string> {
  assertSafeId(studyId);

  const excerpts = sampleExcerpts.slice(0, MAX_EXCERPTS).map((entry) => ({
    choice: entry.choice,
    excerpt: sanitizeExcerpt(entry.excerpt),
  }));

  const evidence: StudyEvidence = {
    studyId,
    writtenAt: new Date().toISOString(),
    aggregate,
    sampleExcerpts: excerpts,
  };

  await mkdir(EVIDENCE_DIR, { recursive: true });
  const filePath = path.join(EVIDENCE_DIR, `${studyId}.json`);
  await writeFile(filePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  await ensureReadme();
  return filePath;
}

const README_CONTENT = `# Terac study evidence

This directory stores demonstration evidence for Terac human-preference
studies run for Tack, per \`PROJECT.md\`'s evidence and safety requirements.

## Sanitization rule

Each \`evidence/terac/<studyId>.json\` file may contain:

- The study id, a timestamp, and aggregated vote counts (\`aVotes\`, \`bVotes\`,
  \`total\`, \`winner\`, \`metric\`).
- At most 3 short excerpts (\`sampleExcerpts\`), each truncated to 240
  characters, of the *variant copy that was picked* by a participant.

Excerpt entries carry only \`{ choice, excerpt }\`. They must never include:

- Participant ids, submission ids, or any Terac-issued identifier.
- Emails, names, or other contact information.
- Demographic, screening-question, or filter/targeting data about any
  individual participant.

If a value would identify or describe a specific participant, drop it before
calling \`writeEvidence\`. When in doubt, omit the excerpt rather than include
a partially-sanitized one.

## Files

- \`<studyId>.json\` -- one file per Terac opportunity id, written by
  \`lib/terac/evidence.ts\` (via \`scripts/terac-study.mjs results <id>\`).
- \`README.md\` -- this file, kept up to date automatically by
  \`writeEvidence()\`.
`;

async function ensureReadme(): Promise<void> {
  const readmePath = path.join(EVIDENCE_DIR, "README.md");
  const current = await readFile(readmePath, "utf8").catch(() => null);
  if (current !== README_CONTENT) {
    await writeFile(readmePath, README_CONTENT, "utf8");
  }
}
