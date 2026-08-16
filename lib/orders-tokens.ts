// Claude-owned (lib/orders-supabase.ts dependency). Pure crypto helpers for
// CONTRACT.md v2 section 6 report/order-access tokens: minted as 32
// cryptographically random bytes, handed to the caller once as base64url,
// and persisted only as a SHA-256 hex digest. No Supabase dependency here so
// this module is testable in plain node (see lib/orders-tokens.test.ts).

import { createHash, randomBytes } from "crypto";

/** Number of random bytes in a minted token, per CONTRACT.md v2 section 6 ("both >= 32 bytes crypto-random"). */
export const TOKEN_BYTES = 32;

/**
 * Mints a new token: `TOKEN_BYTES` bytes of CSPRNG output, base64url-encoded
 * (no padding). Callers return this to the client exactly once and persist
 * only its hash (see hashToken).
 */
export function mintToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * Hashes a raw token to the lowercase hex SHA-256 digest that gets stored
 * (order_access_token_hash / report_token_hash) and compared against on
 * lookup. Never persist or log the raw token itself.
 */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/**
 * Decoded byte length of a base64url token string, used by tests to assert
 * mintToken() actually produced TOKEN_BYTES of entropy rather than just a
 * string of the "right" length.
 */
export function decodedByteLength(token: string): number {
  return Buffer.from(token, "base64url").length;
}
