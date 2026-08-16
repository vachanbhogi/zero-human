# Agent decision: Variant A adopted from Terac study

**Study:** `k3n1qdhhgaj4n0kvxlimoual` (launched 2026-08-16T00:22:43Z, completed ~00:31Z)
**Question:** "Which of these two startup growth pitches is more actionable and specific?"
**Participants:** 5 paid slots, 6 responses received (one extra rater completed before close; all counted)
**Cost:** $22.50 in Terac credits (5 x $4.50)

## Before

The Copywriter agent produced two stylistic variants for every sprint with no evidence which converts better:
- **Variant A** (direct, metric-led)
- **Variant B** (narrative, pain-led)
Default selection was arbitrary (`A`, untested). Both variants were real, unedited pipeline output generated from a live scan of terac.com (see `study-variants.md`, sources and retrieval timestamps in the sprint result).

## Result

| Variant | Votes |
| --- | --- |
| **A (direct, metric-led)** | **4** |
| B (narrative, pain-led) | 2 |

67% preference for Variant A on the actionability/specificity metric. Raw per-participant data stays out of this repository per the sanitization rule; aggregate and sanitized excerpts are in `k3n1qdhhgaj4n0kvxlimoual.json`.

## After (the applied change)

The pipeline's variant selection is now pinned to the human-validated winner: `PIPELINE_VARIANT=A` in the runtime environment, and Variant A's direct metric-led style is the copy every future customer receives. This decision was made and applied by the agent system from real human feedback, with no manual copy editing.
