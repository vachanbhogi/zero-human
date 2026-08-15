import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's TypeScript test runner requires the source extension.
import { ReportRenderValidationError, renderReport } from "./render.ts";
// @ts-expect-error Node's TypeScript test runner requires the source extension.
import type { SprintResult } from "./types.ts";

const source = {
  id: "site-homepage",
  url: "https://example.com",
  retrievedAt: "2026-08-15T12:00:00.000Z",
} as const;

function claim(text: string) {
  return { text, sourceIds: [source.id] } as const;
}

function result(): SprintResult {
  return {
    company: "Example <script>alert(1)</script>",
    generatedAt: "2026-08-15T12:00:00.000Z",
    executiveSummary: claim("Summary <img src=x onerror=alert(1)>"),
    competitors: [
      { name: "Rival", positioning: claim("Position"), weakness: { text: "Recommendation", kind: "recommendation" } },
    ],
    personas: [
      { name: "Founder", pain: claim("Pain"), trigger: { text: "Trigger", kind: "inference" } },
    ],
    outreach: Array.from({ length: 10 }, (_, index) => ({
      angle: claim(`Angle ${index + 1}`),
      body: { text: `Body ${index + 1}`, kind: "recommendation" as const },
    })),
    nextMove: { text: "Send the first play", kind: "recommendation" },
    sources: [source],
    terac: { status: "pending" },
  };
}

test("preserves outreach order and only exposes completed Terac evidence", () => {
  const model = renderReport(result());

  assert.equal(model.outreach.length, 10);
  assert.deepEqual(model.outreach.map((play) => play.position), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(model.outreach[9]?.angle.text, "Angle 10");
  assert.equal(model.terac, undefined);
  assert.equal(model.company, "Example <script>alert(1)</script>");
  assert.equal(model.executiveSummary.text, "Summary <img src=x onerror=alert(1)>");
});

test("rejects anything other than exactly ten outreach plays", () => {
  const invalid = result();
  invalid.outreach = invalid.outreach.slice(0, 9);

  assert.throws(() => renderReport(invalid), (error: unknown) =>
    error instanceof ReportRenderValidationError &&
    error.issues.some((issue) => issue.includes("exactly 10 plays")),
  );
});

test("rejects unlabelled claims and completed Terac entries without real metadata", () => {
  const invalid = result();
  invalid.nextMove = { text: "Unsupported claim" };
  invalid.terac = {
    status: "completed",
    studyId: "",
    completedAt: "not a date",
    metric: "",
    aScore: Number.NaN,
    bScore: 52,
    winner: "A",
  };

  assert.throws(() => renderReport(invalid), (error: unknown) =>
    error instanceof ReportRenderValidationError &&
    error.issues.some((issue) => issue.includes("nextMove needs source IDs")) &&
    error.issues.some((issue) => issue.includes("terac.studyId is required")),
  );
});
