import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_BYTE_LENGTH = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const ORDER_ACCESS_TOKEN_DOMAIN = "tack:order-access-token:v1";
const REPORT_TOKEN_DOMAIN = "tack:report-token:v1";

declare const orderAccessTokenBrand: unique symbol;
declare const reportTokenBrand: unique symbol;
declare const tokenHashBrand: unique symbol;

export type OrderAccessToken = string & {
  readonly [orderAccessTokenBrand]: true;
};

export type ReportToken = string & {
  readonly [reportTokenBrand]: true;
};

export type TokenHash = string & {
  readonly [tokenHashBrand]: true;
};

function parseToken(value: unknown): string | null {
  if (typeof value !== "string" || !TOKEN_PATTERN.test(value)) {
    return null;
  }

  const decoded = Buffer.from(value, "base64url");
  if (decoded.byteLength !== TOKEN_BYTE_LENGTH || decoded.toString("base64url") !== value) {
    return null;
  }

  return value;
}

function createToken(): string {
  return randomBytes(TOKEN_BYTE_LENGTH).toString("base64url");
}

function hashToken(token: string, domain: string): TokenHash {
  return createHash("sha256")
    .update(domain)
    .update("\0")
    .update(token, "utf8")
    .digest("hex") as TokenHash;
}

function parseTokenHash(value: unknown): TokenHash | null {
  return typeof value === "string" && HASH_PATTERN.test(value) ? (value as TokenHash) : null;
}

function hashesEqual(expected: TokenHash, stored: unknown): boolean {
  const parsedStored = parseTokenHash(stored);
  if (!parsedStored) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(parsedStored, "hex"));
}

export function createOrderAccessToken(): OrderAccessToken {
  return createToken() as OrderAccessToken;
}

export function createReportToken(): ReportToken {
  return createToken() as ReportToken;
}

export function parseOrderAccessToken(value: unknown): OrderAccessToken | null {
  return parseToken(value) as OrderAccessToken | null;
}

export function parseReportToken(value: unknown): ReportToken | null {
  return parseToken(value) as ReportToken | null;
}

export function hashOrderAccessToken(token: OrderAccessToken): TokenHash {
  return hashToken(token, ORDER_ACCESS_TOKEN_DOMAIN);
}

export function hashReportToken(token: ReportToken): TokenHash {
  return hashToken(token, REPORT_TOKEN_DOMAIN);
}

export function matchesOrderAccessTokenHash(token: OrderAccessToken, storedHash: unknown): boolean {
  return hashesEqual(hashOrderAccessToken(token), storedHash);
}

export function matchesReportTokenHash(token: ReportToken, storedHash: unknown): boolean {
  return hashesEqual(hashReportToken(token), storedHash);
}
