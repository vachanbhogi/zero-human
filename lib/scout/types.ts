export type BrightDataFailureCode =
  | "invalid_url"
  | "invalid_zone"
  | "missing_api_key"
  | "request_timeout"
  | "network_error"
  | "upstream_error"
  | "non_text_response"
  | "response_too_large"
  | "invalid_response";

export interface BrightDataFailure {
  code: BrightDataFailureCode;
  message: string;
  status?: number;
}

export interface BrightDataSiteContent {
  url: string;
  content: string;
  contentType: string;
  retrievedAt: string;
}

export type BrightDataScoutResult =
  | { ok: true; value: BrightDataSiteContent }
  | { ok: false; error: BrightDataFailure };

export type BrightDataFetch = typeof fetch;

export interface BrightDataScoutOptions {
  fetch?: BrightDataFetch;
  timeoutMs?: number;
  maxResponseBytes?: number;
}
