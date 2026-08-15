// Plain-node unit test for the pipeline core (no test framework installed).
//
// Run with:  node lib/agents/__tests__/pipeline.test.mjs
//
// This file registers a tiny module resolution hook (Node's built-in
// module.registerHooks, no extra dependency) so the "@/..." path alias used
// throughout lib/ resolves the same way it does under Next.js/tsconfig.
// Node 22.6+ strips TypeScript types for .ts files natively, so the real
// pipeline/analyst/copywriter/orders-server/validate TypeScript sources are
// imported and exercised directly — this is not a re-implementation of
// their logic.
//
// Covers CONTRACT.md v2: dispatch-job claiming (section 4), JSON-only
// persistence + validation (section 5).

import assert from "node:assert/strict";
import module from "node:module";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");

module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      let full = path.join(repoRoot, specifier.slice(2));
      if (!path.extname(full)) {
        for (const ext of [".ts", ".tsx", ".mts", ".js"]) {
          if (existsSync(full + ext)) {
            full = full + ext;
            break;
          }
        }
      }
      return nextResolve(pathToFileURL(full).href, context);
    }
    return nextResolve(specifier, context);
  },
});

// Deterministic variant selection unless a test explicitly overrides it.
delete process.env.PIPELINE_VARIANT;

const { runSprint } = await import("@/lib/agents/pipeline");
const { InMemoryOrdersServer } = await import("@/lib/orders-server");
const { validateSprintResult, ValidationError } = await import("@/lib/agents/validate");

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

// --- Fixtures ---------------------------------------------------------

const TEST_ORDER = {
  orderId: "ord_test_001",
  status: "paid",
  createdAt: "2026-08-01T00:00:00.000Z",
  url: "https://testco.example.com",
  niche: "B2B SaaS",
  email: "buyer@example.com",
  company: "TestCo",
};

const SCAN_SOURCE = {
  url: "https://testco.example.com",
  retrievedAt: "2026-08-01T00:00:01.000Z",
};

async function mockGetSiteFacts(url) {
  assert.equal(url, TEST_ORDER.url);
  return {
    profile: {
      name: "TestCo",
      niche: "B2B SaaS",
      summary: "TestCo helps teams do the thing.",
      competitors: ["KnownRival"],
    },
    source: SCAN_SOURCE,
  };
}

function tenOutreachItems(prefix) {
  return Array.from({ length: 10 }, (_, i) => ({
    angle: `${prefix} angle ${i + 1}`,
    subject: i % 2 === 0 ? `${prefix} subject ${i + 1}` : undefined,
    body: `${prefix} body copy for angle ${i + 1}.`,
  }));
}

function validSprintResult(overrides = {}) {
  return {
    orderId: "ord_valid_001",
    company: "ValidCo",
    generatedAt: new Date().toISOString(),
    execSummary: "ValidCo is doing fine.",
    competitors: [
      {
        name: "SourcedRival",
        positioning: "Incumbent.",
        weakness: "Slow.",
        sources: [SCAN_SOURCE],
        inference: false,
      },
      {
        name: "InferredRival",
        positioning: "Open-source alt.",
        weakness: "No support.",
        sources: [],
        inference: true,
      },
    ],
    personas: [{ name: "Buyer", pain: "Pain", trigger: "Trigger" }],
    outreach: tenOutreachItems("V"),
    nextMove: "Do the thing.",
    variantUsed: "A",
    terac: { status: "not_run" },
    sources: [SCAN_SOURCE],
    ...overrides,
  };
}

// Mocked LLM call matches the Groq (OpenAI-compatible) chat-completions
// shape used by lib/agents/analyst.ts / copywriter.ts: a `messages` array
// (system + user) in, `{ choices: [{ message: { content: "<json string>" } }] }`
// out. We branch on the system prompt content to tell the three real calls
// apart (1 analyst call + 2 copywriter variant calls).
let llmCallCount = 0;
async function mockLlmCall(request) {
  llmCallCount += 1;
  const systemContent = request.messages?.find((m) => m.role === "system")?.content ?? "";

  // NOTE: use startsWith, not includes — the Copywriter's own system prompt
  // mentions "the Analyst agent's competitor teardown" in passing, so a
  // naive `.includes("Analyst agent")` check would misfire on it.
  if (systemContent.startsWith("You are the Analyst agent")) {
    const payload = {
      execSummary: "TestCo is well positioned but underpriced against incumbents.",
      competitors: [
        {
          // Matches the scanned profile's competitors list -> should come
          // back with inference: false and a real source.
          name: "KnownRival",
          positioning: "Enterprise incumbent with broad feature set.",
          weakness: "Slow onboarding and expensive per-seat pricing.",
        },
        {
          // Not present anywhere in scanned/order data -> must be marked
          // inference: true with empty sources regardless of what the
          // model itself claims.
          name: "InferredRival",
          positioning: "Open-source alternative with a hosted tier.",
          weakness: "No managed analytics pipeline out of the box.",
        },
      ],
      personas: [
        { name: "Head of Growth", pain: "Low reply rates", trigger: "Missed pipeline target" },
        { name: "Founding Engineer", pain: "No time to build dashboards", trigger: "Just shipped v1" },
      ],
    };
    return { choices: [{ message: { role: "assistant", content: JSON.stringify(payload) } }] };
  }

  if (systemContent.startsWith("You are the Copywriter agent")) {
    const prefix = systemContent.includes("direct and metric-led") ? "A" : "B";
    const payload = {
      outreach: tenOutreachItems(prefix),
      nextMove: `Do the ${prefix} thing this week.`,
    };
    return { choices: [{ message: { role: "assistant", content: JSON.stringify(payload) } }] };
  }

  throw new Error("mockLlmCall: unrecognized system prompt (neither Analyst nor Copywriter)");
}

// --- Tests: runSprint / pipeline ----------------------------------------

await check("runSprint produces a well-shaped, validated SprintResult (no HTML)", async () => {
  const ordersServer = new InMemoryOrdersServer([TEST_ORDER]);

  const runResult = await runSprint(TEST_ORDER.orderId, {
    ordersServer,
    getSiteFacts: mockGetSiteFacts,
    llmCall: mockLlmCall,
  });
  const { sprintResult } = runResult;

  // No reportHtml: rendering happens at view time in Codex-owned components.
  assert.equal("reportHtml" in runResult, false, "runSprint must not return reportHtml");

  assert.equal(sprintResult.orderId, TEST_ORDER.orderId);
  assert.equal(sprintResult.company, "TestCo");
  assert.equal(typeof sprintResult.generatedAt, "string");
  assert.ok(!Number.isNaN(Date.parse(sprintResult.generatedAt)), "generatedAt must be a valid ISO date");
  assert.equal(typeof sprintResult.execSummary, "string");
  assert.ok(sprintResult.execSummary.length > 0);

  assert.equal(sprintResult.competitors.length, 2);
  assert.equal(sprintResult.personas.length, 2);

  assert.equal(sprintResult.outreach.length, 10, "chosen variant must carry exactly 10 outreach angles");
  assert.equal(typeof sprintResult.nextMove, "string");
  assert.ok(sprintResult.nextMove.length > 0);

  assert.equal(sprintResult.variantUsed, "A", "default variant must be A when PIPELINE_VARIANT is unset");
  assert.equal(sprintResult.outreach[0].angle, "A angle 1", "variant A copy must be the one selected by default");

  assert.deepEqual(sprintResult.terac, { status: "not_run" }, "terac defaults to not_run until a study completes");

  assert.ok(Array.isArray(sprintResult.sources));
  assert.ok(
    sprintResult.sources.some((s) => s.url === SCAN_SOURCE.url),
    "sources must include the Scout's SourceRef"
  );
  for (const source of sprintResult.sources) {
    assert.equal(typeof source.url, "string");
    assert.equal(typeof source.retrievedAt, "string");
  }

  // Analyst call (1) + Copywriter variant A + variant B (2) per runSprint call.
  assert.ok(llmCallCount >= 3, "expected at least one analyst call and two copywriter variant calls");
});

await check("inference competitors carry inference: true with empty sources", async () => {
  const ordersServer = new InMemoryOrdersServer([{ ...TEST_ORDER, orderId: "ord_test_002" }]);

  const { sprintResult } = await runSprint("ord_test_002", {
    ordersServer,
    getSiteFacts: mockGetSiteFacts,
    llmCall: mockLlmCall,
  });

  const known = sprintResult.competitors.find((c) => c.name === "KnownRival");
  const inferred = sprintResult.competitors.find((c) => c.name === "InferredRival");

  assert.ok(known, "expected the known competitor to be present");
  assert.equal(known.inference, false);
  assert.ok(known.sources.length > 0, "a known/sourced competitor must carry at least one SourceRef");

  assert.ok(inferred, "expected the inferred competitor to be present");
  assert.equal(inferred.inference, true);
  assert.deepEqual(inferred.sources, [], "an inferred competitor must carry an empty sources array");

  // Every runSprint output must itself pass validation (belt-and-suspenders:
  // runSprint already validates internally and would have thrown otherwise).
  assert.doesNotThrow(() => validateSprintResult(sprintResult));
});

// --- Tests: dispatch claiming (CONTRACT.md v2 section 4) -----------------

await check("claimDispatch: claim once proceeds, claim twice is skipped", async () => {
  const ordersServer = new InMemoryOrdersServer([{ ...TEST_ORDER, orderId: "ord_dispatch_001" }]);
  ordersServer.seedDispatch("disp_001", "ord_dispatch_001");

  const firstClaim = await ordersServer.claimDispatch("disp_001");
  assert.deepEqual(
    firstClaim,
    { orderId: "ord_dispatch_001" },
    "first claim on a queued dispatch job must proceed and return its orderId"
  );

  const secondClaim = await ordersServer.claimDispatch("disp_001");
  assert.equal(secondClaim, null, "second claim on an already-claimed dispatch job must be skipped (null)");

  const thirdClaim = await ordersServer.claimDispatch("disp_001");
  assert.equal(thirdClaim, null, "repeated claims stay skipped (retry-safe)");

  const missingClaim = await ordersServer.claimDispatch("does_not_exist");
  assert.equal(missingClaim, null, "claiming an unknown dispatchId must fail closed (null), not throw");
});

await check(
  "claimDispatch end-to-end mirrors the /api/run route: claim -> runSprint -> completeOrder",
  async () => {
    const ordersServer = new InMemoryOrdersServer([{ ...TEST_ORDER, orderId: "ord_dispatch_002" }]);
    ordersServer.seedDispatch("disp_002", "ord_dispatch_002");

    const claim = await ordersServer.claimDispatch("disp_002");
    assert.ok(claim, "claim must succeed for a queued job");

    const { sprintResult } = await runSprint(claim.orderId, {
      ordersServer,
      getSiteFacts: mockGetSiteFacts,
      llmCall: mockLlmCall,
    });

    const { reportToken } = await ordersServer.completeOrder(claim.orderId, sprintResult);
    assert.equal(typeof reportToken, "string");
    assert.ok(reportToken.length > 0);

    const order = await ordersServer.getOrder("ord_dispatch_002");
    assert.equal(order.status, "completed");

    // A retried trigger for the same dispatchId (e.g. a cron re-drain) must
    // now be a safe no-op, not a second pipeline run.
    const retriedClaim = await ordersServer.claimDispatch("disp_002");
    assert.equal(retriedClaim, null, "a dispatch job already claimed/completed must not be re-claimable");
  }
);

await check("claimOrderForProcessing (internal helper) is idempotent", async () => {
  const ordersServer = new InMemoryOrdersServer([{ ...TEST_ORDER, orderId: "ord_test_003" }]);

  const firstClaim = await ordersServer.claimOrderForProcessing("ord_test_003");
  assert.equal(firstClaim, true, "first claim on a paid order must succeed");

  const secondClaim = await ordersServer.claimOrderForProcessing("ord_test_003");
  assert.equal(secondClaim, false, "second claim on an already-claimed order must be rejected");

  const order = await ordersServer.getOrder("ord_test_003");
  assert.equal(order.status, "processing");

  const missingClaim = await ordersServer.claimOrderForProcessing("does_not_exist");
  assert.equal(missingClaim, false, "claiming an unknown orderId must fail closed, not throw");
});

await check("completeOrder fails closed for unknown orders", async () => {
  const ordersServer = new InMemoryOrdersServer();
  await assert.rejects(
    () => ordersServer.completeOrder("unknown_order", validSprintResult()),
    /unknown orderId/,
    "completeOrder must throw rather than silently mint a token for a missing order"
  );
});

// --- Tests: validateSprintResult (CONTRACT.md v2 section 5) --------------

await check("validateSprintResult accepts a well-formed result", () => {
  assert.doesNotThrow(() => validateSprintResult(validSprintResult()));
});

await check("validateSprintResult rejects outreach counts other than exactly 10", () => {
  const badFew = validSprintResult({ outreach: tenOutreachItems("X").slice(0, 9) });
  assert.throws(() => validateSprintResult(badFew), ValidationError);

  const badMany = validSprintResult({ outreach: [...tenOutreachItems("X"), { angle: "extra", body: "extra" }] });
  assert.throws(() => validateSprintResult(badMany), ValidationError);
});

await check(
  "validateSprintResult rejects a competitor with neither sources[] nor inference: true",
  () => {
    const bad = validSprintResult({
      competitors: [
        { name: "Unsourced", positioning: "p", weakness: "w", sources: [], inference: false },
      ],
    });
    assert.throws(() => validateSprintResult(bad), ValidationError);
  }
);

await check(
  "validateSprintResult rejects a competitor marked inference: true that also carries sources[]",
  () => {
    const bad = validSprintResult({
      competitors: [
        { name: "Contradictory", positioning: "p", weakness: "w", sources: [SCAN_SOURCE], inference: true },
      ],
    });
    assert.throws(() => validateSprintResult(bad), ValidationError);
  }
);

await check('validateSprintResult accepts terac: { status: "not_run" }', () => {
  assert.doesNotThrow(() => validateSprintResult(validSprintResult({ terac: { status: "not_run" } })));
});

await check(
  'validateSprintResult accepts a fully-populated terac: { status: "completed", ... }',
  () => {
    const ok = validSprintResult({
      terac: { status: "completed", studyId: "terac_1", aScore: 40, bScore: 60, metric: "reply_intent_rate" },
    });
    assert.doesNotThrow(() => validateSprintResult(ok));
  }
);

await check(
  'validateSprintResult rejects terac: { status: "completed" } missing studyId/scores/metric',
  () => {
    const bad = validSprintResult({ terac: { status: "completed" } });
    assert.throws(() => validateSprintResult(bad), ValidationError);
  }
);

await check("validateSprintResult rejects an unknown terac.status", () => {
  const bad = validSprintResult({ terac: { status: "in_progress" } });
  assert.throws(() => validateSprintResult(bad), ValidationError);
});

await check("pipeline refuses to persist an invalid result (throws before completeOrder)", async () => {
  let callCount = 0;
  const badLlmCall = async (request) => {
    callCount += 1;
    const systemContent = request.messages?.find((m) => m.role === "system")?.content ?? "";
    if (systemContent.startsWith("You are the Analyst agent")) {
      return mockLlmCall(request);
    }
    if (systemContent.startsWith("You are the Copywriter agent")) {
      // Return only 9 outreach items instead of the required 10 -> the
      // Copywriter's own validation should already reject this, which is
      // itself proof the pipeline can never hand back an invalid result.
      const prefix = systemContent.includes("direct and metric-led") ? "A" : "B";
      const payload = { outreach: tenOutreachItems(prefix).slice(0, 9), nextMove: "Do it." };
      return { choices: [{ message: { role: "assistant", content: JSON.stringify(payload) } }] };
    }
    throw new Error("unexpected system prompt");
  };

  const ordersServer = new InMemoryOrdersServer([{ ...TEST_ORDER, orderId: "ord_invalid_001" }]);

  await assert.rejects(
    () =>
      runSprint("ord_invalid_001", {
        ordersServer,
        getSiteFacts: mockGetSiteFacts,
        llmCall: badLlmCall,
      }),
    /outreach/i,
    "runSprint must throw rather than return a result with the wrong outreach count"
  );
  assert.ok(callCount > 0, "sanity: the mock was actually invoked");
});

console.log(`\n${passed} test group(s) passed.`);
