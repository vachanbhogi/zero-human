// Plain-node unit test for the durable orders layer (no test framework
// installed) — mirrors the resolver/runner convention already used by
// lib/agents/__tests__/pipeline.test.mjs.
//
// Run with:  node lib/__tests__/orders-durability.test.mjs
//
// Covers:
//  - lib/orders-tokens.ts: mintToken/hashToken shape and determinism.
//  - lib/orders-factory.ts: getOrdersServer() falls back to
//    InMemoryOrdersServer when Supabase env vars are unset, and selects
//    SupabaseOrdersServer when both are set (construction only — no
//    network call happens, so this needs no live Supabase project).

import assert from "node:assert/strict";
import module from "node:module";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

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

const { mintToken, hashToken, decodedByteLength, TOKEN_BYTES } = await import(
  "@/lib/orders-tokens"
);
const { InMemoryOrdersServer } = await import("@/lib/orders-server");
const { SupabaseOrdersServer } = await import("@/lib/orders-supabase");
const { getOrdersServer, resetOrdersServerForTests } = await import("@/lib/orders-factory");

let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

// --- Tests: lib/orders-tokens.ts -----------------------------------------

await check("mintToken produces exactly TOKEN_BYTES (32) bytes of entropy", () => {
  const token = mintToken();
  assert.equal(typeof token, "string");
  assert.ok(token.length > 0);
  assert.equal(decodedByteLength(token), TOKEN_BYTES);
  assert.equal(TOKEN_BYTES, 32, "CONTRACT.md v2 section 6 requires >= 32 bytes crypto-random");
});

await check("mintToken is base64url (no +, /, or = padding characters)", () => {
  const token = mintToken();
  assert.ok(!token.includes("+"), "base64url must not contain '+'");
  assert.ok(!token.includes("/"), "base64url must not contain '/'");
  assert.ok(!token.includes("="), "base64url must not contain padding '='");
});

await check("mintToken is not deterministic across calls", () => {
  const a = mintToken();
  const b = mintToken();
  assert.notEqual(a, b, "two mints must not collide (would indicate a broken RNG)");
});

await check("hashToken returns a 64-char lowercase hex SHA-256 digest", () => {
  const digest = hashToken("some-raw-token-value");
  assert.equal(digest.length, 64);
  assert.match(digest, /^[0-9a-f]{64}$/, "must be lowercase hex");
});

await check("hashToken is deterministic for the same input", () => {
  const token = mintToken();
  assert.equal(hashToken(token), hashToken(token));
});

await check("hashToken differs for different inputs", () => {
  const a = mintToken();
  const b = mintToken();
  assert.notEqual(hashToken(a), hashToken(b));
});

await check("hashToken never returns the raw input (no accidental passthrough)", () => {
  const token = mintToken();
  assert.notEqual(hashToken(token), token);
});

// --- Tests: lib/orders-factory.ts -----------------------------------------

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"];

function withEnv(overrides, fn) {
  const saved = {};
  for (const key of ENV_KEYS) saved[key] = process.env[key];
  try {
    for (const key of ENV_KEYS) {
      if (overrides[key] === undefined) delete process.env[key];
      else process.env[key] = overrides[key];
    }
    return fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

await check("getOrdersServer falls back to InMemoryOrdersServer when Supabase env vars are unset", () => {
  withEnv({}, () => {
    resetOrdersServerForTests();
    const server = getOrdersServer();
    assert.ok(server instanceof InMemoryOrdersServer, "expected the in-memory stub with no Supabase env vars");
  });
});

await check(
  "getOrdersServer falls back to InMemoryOrdersServer when only one of the two Supabase env vars is set",
  () => {
    withEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" }, () => {
      resetOrdersServerForTests();
      const server = getOrdersServer();
      assert.ok(server instanceof InMemoryOrdersServer, "one env var alone must not select Supabase");
    });
  }
);

await check("getOrdersServer selects SupabaseOrdersServer when both Supabase env vars are set", () => {
  withEnv(
    { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SECRET_KEY: "fake-service-role-key" },
    () => {
      resetOrdersServerForTests();
      const server = getOrdersServer();
      assert.ok(
        server instanceof SupabaseOrdersServer,
        "expected the Supabase-backed implementation once both env vars are set"
      );
    }
  );
});

await check("getOrdersServer caches the instance across calls within a process", () => {
  withEnv({}, () => {
    resetOrdersServerForTests();
    const first = getOrdersServer();
    const second = getOrdersServer();
    assert.equal(first, second, "repeated calls must return the same cached instance");
  });
});

// Leave the module-level cache clean for anything imported after this file
// (harmless in a one-shot `node ...test.mjs` run, but avoids surprises if
// this file is ever imported rather than executed directly).
resetOrdersServerForTests();

console.log(`\n${passed} test group(s) passed.`);
