// Scout agent: calls the existing /api/scan route to turn a raw URL into a
// ScannedProfile, and wraps the result with a SourceRef so downstream
// agents can cite where the data came from.

import type { ScannedProfile } from "@/lib/types";
import type { SourceRef } from "@/lib/pipeline-types";
import { configuredSiteOrigin } from "@/utils/site-origin";

const SCAN_TIMEOUT_MS = 10_000;

export class ScoutError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = "ScoutError";
  }
}

export interface SiteFacts {
  profile: ScannedProfile;
  source: SourceRef;
}

interface ScanApiResponse {
  success?: boolean;
  websiteUrl?: string;
  profile?: ScannedProfile;
  error?: string;
}

/**
 * Scans a company's website via the existing /api/scan route and returns
 * the resulting profile plus a SourceRef for provenance.
 *
 * Requires NEXT_PUBLIC_SITE_URL (or VERCEL_URL) to be set so we know which
 * origin to call — see utils/site-origin.ts.
 */
export async function getSiteFacts(url: string): Promise<SiteFacts> {
  const origin = configuredSiteOrigin();
  if (!origin) {
    throw new ScoutError(
      "Cannot resolve site origin (NEXT_PUBLIC_SITE_URL / VERCEL_URL not set); cannot call /api/scan."
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${origin}/api/scan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new ScoutError(
      aborted
        ? `Scan of ${url} timed out after ${SCAN_TIMEOUT_MS}ms`
        : `Scan request for ${url} failed: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  } finally {
    clearTimeout(timeout);
  }

  let body: ScanApiResponse;
  try {
    body = (await res.json()) as ScanApiResponse;
  } catch (err) {
    throw new ScoutError(`/api/scan returned a non-JSON response (status ${res.status})`, err);
  }

  if (!res.ok || !body.profile) {
    throw new ScoutError(
      `/api/scan responded ${res.status}${body.error ? `: ${body.error}` : ""}`
    );
  }

  const source: SourceRef = {
    url: body.websiteUrl ?? url,
    retrievedAt: new Date().toISOString(),
  };

  return { profile: body.profile, source };
}
