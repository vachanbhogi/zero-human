import type {
  BrightDataFetch,
  BrightDataScoutOptions,
  BrightDataScoutResult,
} from "./types";
import { isIP } from "node:net";

const BRIGHT_DATA_REQUEST_URL = "https://api.brightdata.com/request";
const DEFAULT_ZONE = "tack";
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

class ResponseTooLargeError extends Error {
  constructor() {
    super("Bright Data response exceeded the configured size limit.");
  }
}

class RequestTimeoutError extends Error {
  constructor() {
    super("Bright Data request timed out.");
  }
}

function failure(
  code: Extract<BrightDataScoutResult, { ok: false }>["error"]["code"],
  message: string,
  status?: number
): BrightDataScoutResult {
  return { ok: false, error: { code, message, ...(status === undefined ? {} : { status }) } };
}

function validateTargetUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password ||
      isPrivateOrLocalHost(url.hostname)
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.startsWith("localhost.") ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    return true;
  }

  if (isIP(host) === 4) {
    const [a, b] = host.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0) ||
      a >= 224
    );
  }

  if (isIP(host) !== 6) return false;
  if (host === "::" || host === "::1" || host.startsWith("::ffff:")) return true;
  const firstHextet = Number.parseInt(host.split(":", 1)[0], 16);
  return (
    (firstHextet >= 0xfc00 && firstHextet <= 0xfdff) ||
    (firstHextet >= 0xfe80 && firstHextet <= 0xfebf) ||
    firstHextet >= 0xff00 ||
    host.startsWith("2001:db8:")
  );
}

function isTextContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
  return (
    mediaType.startsWith("text/") ||
    mediaType === "application/json" ||
    mediaType === "application/xml" ||
    mediaType.endsWith("+json") ||
    mediaType.endsWith("+xml")
  );
}

function headerValue(headers: Record<string, unknown>, name: string): string | null {
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  return typeof entry?.[1] === "string" ? entry[1] : null;
}

async function waitForBodyRead<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw new RequestTimeoutError();
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new RequestTimeoutError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      }
    );
  });
}

async function readBoundedText(
  response: Response,
  maxResponseBytes: number,
  signal: AbortSignal
): Promise<string> {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > maxResponseBytes) {
    throw new ResponseTooLargeError();
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const bytes = new Uint8Array(await waitForBodyRead(response.arrayBuffer(), signal));
    if (bytes.byteLength > maxResponseBytes) throw new ResponseTooLargeError();
    return new TextDecoder().decode(bytes);
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await waitForBodyRead(reader.read(), signal);
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maxResponseBytes) {
        await reader.cancel();
        throw new ResponseTooLargeError();
      }
      chunks.push(next.value);
    }
  } finally {
    if (signal.aborted) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function extractContent(raw: string, responseContentType: string):
  | { content: string; contentType: string }
  | null {
  const mediaType = responseContentType.split(";", 1)[0].trim().toLowerCase();
  if (mediaType !== "application/json" && !mediaType.endsWith("+json")) {
    return { content: raw, contentType: responseContentType };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("body" in parsed) ||
      !("headers" in parsed) ||
      typeof parsed.body !== "string" ||
      !parsed.headers ||
      typeof parsed.headers !== "object" ||
      Array.isArray(parsed.headers)
    ) {
      return { content: raw, contentType: responseContentType };
    }

    const status = "status_code" in parsed ? parsed.status_code : undefined;
    if (typeof status === "number" && status >= 400) return null;
    const contentType = headerValue(parsed.headers as Record<string, unknown>, "content-type");
    if (!isTextContentType(contentType)) return null;
    return { content: parsed.body, contentType: contentType! };
  } catch {
    return { content: raw, contentType: responseContentType };
  }
}

export async function fetchSiteContent(
  targetUrl: string,
  options: BrightDataScoutOptions = {}
): Promise<BrightDataScoutResult> {
  const url = validateTargetUrl(targetUrl);
  if (!url) {
    return failure("invalid_url", "Target URL must be an absolute HTTPS URL without credentials.");
  }

  const apiKey = process.env.BRIGHT_DATA_API_KEY?.trim();
  if (!apiKey) {
    return failure("missing_api_key", "BRIGHT_DATA_API_KEY is not configured.");
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || !Number.isSafeInteger(maxResponseBytes) || maxResponseBytes <= 0) {
    return failure("invalid_response", "Scout timeout and response-size limits must be positive integers.");
  }

  const zone = process.env.BRIGHT_DATA_ZONE?.trim() || DEFAULT_ZONE;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(zone)) {
    return failure("invalid_zone", "BRIGHT_DATA_ZONE must be a 1-64 character identifier.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requestFetch: BrightDataFetch = options.fetch ?? fetch;

  try {
    const response = await requestFetch(BRIGHT_DATA_REQUEST_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        zone,
        url,
        format: "raw",
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return failure("upstream_error", `Bright Data returned HTTP ${response.status}.`, response.status);
    }

    const responseContentType = response.headers.get("content-type");
    if (!isTextContentType(responseContentType)) {
      return failure("non_text_response", "Bright Data returned a non-text response.");
    }

    const raw = await readBoundedText(response, maxResponseBytes, controller.signal);
    const content = extractContent(raw, responseContentType!);
    if (!content) {
      return failure("non_text_response", "Bright Data returned a non-text or unsuccessful target response.");
    }
    if (new TextEncoder().encode(content.content).byteLength > maxResponseBytes) {
      return failure("response_too_large", "Bright Data response exceeded the configured size limit.");
    }

    return {
      ok: true,
      value: {
        url,
        content: content.content,
        contentType: content.contentType,
        retrievedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (controller.signal.aborted || error instanceof RequestTimeoutError) {
      return failure("request_timeout", `Bright Data request timed out after ${timeoutMs}ms.`);
    }
    if (error instanceof ResponseTooLargeError) {
      return failure("response_too_large", error.message);
    }
    return failure("network_error", "Bright Data request could not be completed.");
  } finally {
    clearTimeout(timeout);
  };
}
