// Plain-node unit test for the pipeline core (no test framework installed).
//
// Run with:  node lib/agents/__tests__/pipeline.test.mjs
//
// This file registers a tiny module resolution hook (Node's built-in
// module.registerHooks, no extra dependency) so the "@/..." path alias used
// throughout lib/ resolves the same way it does under Next.js/tsconfig.
// Node 22.6+ strips TypeScript types for .ts files natively, so the real
// pipeline/analyst/copywriter/orders-server TypeScript sources are imported
// and exercised directly — this is not a re-implementation of their logic.

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

// --- Tests --------------------------------------------------------------

await check("runSprint produces a well-shaped SprintResult", async () => {
  const ordersServer = new InMemoryOrdersServer([TEST_ORDER]);

  const { sprintResult, reportHtml } = await runSprint(TEST_ORDER.orderId, {
    ordersServer,
    getSiteFacts: mockGetSiteFacts,
    llmCall: mockLlmCall,
  });

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

  assert.ok(Array.isArray(sprintResult.sources));
  assert.ok(
    sprintResult.sources.some((s) => s.url === SCAN_SOURCE.url),
    "sources must include the Scout's SourceRef"
  );
  for (const source of sprintResult.sources) {
    assert.equal(typeof source.url, "string");
    assert.equal(typeof source.retrievedAt, "string");
  }

  assert.equal(typeof reportHtml, "string");
  assert.ok(reportHtml.includes("<!doctype html>"));
  assert.ok(reportHtml.includes("TestCo"));

  // Analyst call (1) + Copywriter variant A + variant B (2) = 3.
  assert.equal(llmCallCount, 3, "expected one analyst call and two copywriter variant calls");
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
});

await check("claimOrderForProcessing is idempotent (fail-closed on repeat claims)", async () => {
  const ordersServer = new InMemoryOrdersServer([{ ...TEST_ORDER, orderId: "ord_test_003" }]);

  const firstClaim = await ordersServer.claimOrderForProcessing("ord_test_003");
  assert.equal(firstClaim, true, "first claim on a paid order must succeed");

  const secondClaim = await ordersServer.claimOrderForProcessing("ord_test_003");
  assert.equal(secondClaim, false, "second claim on an already-claimed order must be rejected");

  const thirdClaim = await ordersServer.claimOrderForProcessing("ord_test_003");
  assert.equal(thirdClaim, false, "repeated claims stay rejected (retry-safe)");

  const order = await ordersServer.getOrder("ord_test_003");
  assert.equal(order.status, "processing");

  const missingClaim = await ordersServer.claimOrderForProcessing("does_not_exist");
  assert.equal(missingClaim, false, "claiming an unknown orderId must fail closed, not throw");
});

await check("completeOrder fails closed for unknown orders", async () => {
  const ordersServer = new InMemoryOrdersServer();
  await assert.rejects(
    () => ordersServer.completeOrder("unknown_order", "<html></html>"),
    /unknown orderId/,
    "completeOrder must throw rather than silently mint a token for a missing order"
  );
});

console.log(`\n${passed} test group(s) passed.`);
