import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

import {
  createOrderAccessToken,
  createReportToken,
  hashOrderAccessToken,
  hashReportToken,
  matchesOrderAccessTokenHash,
  matchesReportTokenHash,
  parseOrderAccessToken,
  parseReportToken,
} from "./token.ts";

test("creates canonical base64url tokens from 32 random bytes", () => {
  const orderAccessToken = createOrderAccessToken();
  const reportToken = createReportToken();

  for (const token of [orderAccessToken, reportToken]) {
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(Buffer.from(token, "base64url").byteLength, 32);
    assert.equal(Buffer.from(token, "base64url").toString("base64url"), token);
  }
});

test("creates distinct tokens", () => {
  const tokens = new Set(Array.from({ length: 32 }, createOrderAccessToken));

  assert.equal(tokens.size, 32);
});

test("hashing is stable and produces a SHA-256-sized durable value", () => {
  const token = createOrderAccessToken();
  const hash = hashOrderAccessToken(token);

  assert.equal(hashOrderAccessToken(token), hash);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test("parsers reject non-canonical and incorrectly sized encodings", () => {
  const valid = randomBytes(32).toString("base64url");
  const invalid = [
    undefined,
    null,
    "",
    `${valid}=`,
    valid.slice(0, -1),
    valid.replace(/./, "*"),
    randomBytes(31).toString("base64url"),
    randomBytes(33).toString("base64url"),
  ];

  assert.equal(parseOrderAccessToken(valid), valid);
  assert.equal(parseReportToken(valid), valid);
  for (const value of invalid) {
    assert.equal(parseOrderAccessToken(value), null);
    assert.equal(parseReportToken(value), null);
  }
});

test("hash comparisons accept only exact SHA-256 hashes", () => {
  const orderAccessToken = createOrderAccessToken();
  const orderHash = hashOrderAccessToken(orderAccessToken);

  assert.equal(matchesOrderAccessTokenHash(orderAccessToken, orderHash), true);
  assert.equal(matchesOrderAccessTokenHash(orderAccessToken, `${orderHash}0`), false);
  assert.equal(matchesOrderAccessTokenHash(orderAccessToken, orderHash.toUpperCase()), false);
  assert.equal(matchesOrderAccessTokenHash(orderAccessToken, "not-a-hash"), false);
});

test("order-access and report-token hashes are separate domains", () => {
  const rawToken = randomBytes(32).toString("base64url");
  const orderAccessToken = parseOrderAccessToken(rawToken);
  const reportToken = parseReportToken(rawToken);

  assert.ok(orderAccessToken);
  assert.ok(reportToken);

  const orderHash = hashOrderAccessToken(orderAccessToken);
  const reportHash = hashReportToken(reportToken);

  assert.notEqual(orderHash, reportHash);
  assert.equal(matchesOrderAccessTokenHash(orderAccessToken, orderHash), true);
  assert.equal(matchesReportTokenHash(reportToken, reportHash), true);
  assert.equal(matchesOrderAccessTokenHash(orderAccessToken, reportHash), false);
  assert.equal(matchesReportTokenHash(reportToken, orderHash), false);
});
