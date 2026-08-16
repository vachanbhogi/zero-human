import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's TypeScript test runner requires the source extension.
import { ReportRenderValidationError, renderReport } from "./render.ts";
import type { SprintResult } from "../pipeline-types";

const source = {
  url: "https://example.com",
  retrievedAt: "2026-08-15T12:00:00.000Z",
} as const;

function result(): SprintResult {
  return {
    orderId: "order-1",
    company: "Example <script>alert(1)</script>",
    generatedAt: "2026-08-15T12:00:00.000Z",
    execSummary: "Summary <img src=x onerror=alert(1)>",
    competitors: [{ name: "Rival", positioning: "Position", weakness: "Weakness", sources: [source] }],
    personas: [{ name: "Founder", pain: "Pain", trigger: "Trigger" }],
    outreach: Array.from({ length: 10 }, (_, index) => ({ angle: `Angle ${index + 1}`, body: `Body ${index + 1}` })),
    nextMove: "Send the first play",
    variantUsed: "A",
    sources: [source],
    terac: { status: "not_run" },
  };
}

test("renders validated stored JSON in order and hides incomplete Terac evidence", () => {
  const model = renderReport(JSON.parse(JSON.stringify(result())) as SprintResult);

  assert.deepEqual(model.outreach.map((play) => play.position), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(model.outreach[9]?.angle, "Angle 10");
  assert.equal(model.terac, undefined);
  assert.equal(model.company, "Example <script>alert(1)</script>");
  assert.equal(model.execSummary, "Summary <img src=x onerror=alert(1)>");
});

test("rejects anything other than exactly ten outreach plays", () => {
  const invalid = result();
  invalid.outreach = invalid.outreach.slice(0, 9);

  assert.throws(() => renderReport(invalid), (error: unknown) =>
    error instanceof ReportRenderValidationError && error.issues.some((issue) => issue.includes("exactly 10 plays")),
  );
});

test("rejects competitor claims without a source or inference label", () => {
  const invalid = result();
  invalid.competitors = [{ name: "Unsupported rival", positioning: "Position", weakness: "Weakness", sources: [] }];

  assert.throws(() => renderReport(invalid), (error: unknown) =>
    error instanceof ReportRenderValidationError && error.issues.some((issue) => issue.includes("needs sources or inference: true")),
  );
});

test("rejects completed Terac evidence without real metadata", () => {
  const invalid = result();
  invalid.terac = { status: "completed", studyId: "", metric: "", aScore: Number.NaN, bScore: 52 };

  assert.throws(() => renderReport(invalid), (error: unknown) =>
    error instanceof ReportRenderValidationError &&
    error.issues.some((issue) => issue.includes("terac.studyId is required")) &&
    error.issues.some((issue) => issue.includes("terac scores must be finite numbers")),
  );
});

test("turns malformed stored JSON into validation errors", () => {
  const malformed = JSON.parse(JSON.stringify(result())) as Record<string, unknown>;
  malformed.company = null;
  malformed.generatedAt = 123;
  malformed.sources = {};
  malformed.execSummary = 7;
  malformed.competitors = [null];
  malformed.personas = "not an array";
  malformed.outreach = null;
  malformed.nextMove = null;
  malformed.terac = { status: "completed", studyId: null, metric: [], aScore: "5", bScore: null };

  assert.throws(() => renderReport(malformed), (error: unknown) =>
    error instanceof ReportRenderValidationError &&
    error.issues.some((issue) => issue === "company must be a string") &&
    error.issues.some((issue) => issue === "outreach must be an array") &&
    error.issues.some((issue) => issue === "terac scores must be finite numbers"),
  );
});

test("requires calendar-valid ISO-8601 timestamps", () => {
  const invalid = result();
  invalid.generatedAt = "2026-02-30T12:00:00Z";

  assert.throws(() => renderReport(invalid), (error: unknown) =>
    error instanceof ReportRenderValidationError && error.issues.some((issue) => issue === "generatedAt must be an ISO-8601 timestamp"),
  );
});
