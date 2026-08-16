# Terac study evidence

This directory stores demonstration evidence for Terac human-preference
studies run for Tack, per `PROJECT.md`'s evidence and safety requirements.

## Sanitization rule

Each `evidence/terac/<studyId>.json` file may contain:

- The study id, a timestamp, and aggregated vote counts (`aVotes`, `bVotes`,
  `total`, `winner`, `metric`).
- At most 3 short excerpts (`sampleExcerpts`), each truncated to 240
  characters, of the *variant copy that was picked* by a participant.

Excerpt entries carry only `{ choice, excerpt }`. They must never include:

- Participant ids, submission ids, or any Terac-issued identifier.
- Emails, names, or other contact information.
- Demographic, screening-question, or filter/targeting data about any
  individual participant.

If a value would identify or describe a specific participant, drop it before
calling `writeEvidence`. When in doubt, omit the excerpt rather than include
a partially-sanitized one.

## Files

- `<studyId>.json` -- one file per Terac opportunity id, written by
  `lib/terac/evidence.ts` (via `scripts/terac-study.mjs results <id>`).
- `README.md` -- this file, kept up to date automatically by
  `writeEvidence()`.
