import assert from "node:assert/strict";
import test from "node:test";

import { fetchSiteContent } from "./bright-data.ts";

const originalApiKey = process.env.BRIGHT_DATA_API_KEY;
const originalZone = process.env.BRIGHT_DATA_ZONE;

function setCredentials(): void {
  process.env.BRIGHT_DATA_API_KEY = "test-key";
  delete process.env.BRIGHT_DATA_ZONE;
}

function restoreCredentials(): void {
  if (originalApiKey === undefined) delete process.env.BRIGHT_DATA_API_KEY;
  else process.env.BRIGHT_DATA_API_KEY = originalApiKey;
  if (originalZone === undefined) delete process.env.BRIGHT_DATA_ZONE;
  else process.env.BRIGHT_DATA_ZONE = originalZone;
}

test.after(restoreCredentials);

test("rejects non-HTTPS targets before making a request", async () => {
  setCredentials();
  let called = false;
  const result = await fetchSiteContent("http://example.com", {
    fetch: async () => {
      called = true;
      return new Response();
    },
  });

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "invalid_url",
      message: "Target URL must be an absolute HTTPS URL without credentials.",
    },
  });
  assert.equal(called, false);
});

test("reports a missing API key without calling Bright Data", async () => {
  delete process.env.BRIGHT_DATA_API_KEY;
  const result = await fetchSiteContent("https://example.com", {
    fetch: async () => {
      throw new Error("must not fetch");
    },
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "missing_api_key");
});

test("uses Bright Data's raw request shape and default tack zone", async () => {
  setCredentials();
  let request: Request | undefined;
  const result = await fetchSiteContent("https://example.com/path", {
    fetch: async (input, init) => {
      request = new Request(input, init);
      return new Response("<main>Example</main>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(request?.url, "https://api.brightdata.com/request");
  assert.equal(request?.method, "POST");
  assert.equal(request?.headers.get("authorization"), "Bearer test-key");
  assert.deepEqual(await request?.json(), {
    zone: "tack",
    url: "https://example.com/path",
    format: "raw",
  });
  if (result.ok) assert.equal(result.value.content, "<main>Example</main>");
});

test("extracts text content from Bright Data's JSON response envelope", async () => {
  setCredentials();
  const result = await fetchSiteContent("https://example.com", {
    fetch: async () =>
      new Response(
        JSON.stringify({
          status_code: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
          body: "<h1>Example</h1>",
        }),
        { headers: { "content-type": "application/json" } }
      ),
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.content, "<h1>Example</h1>");
    assert.equal(result.value.contentType, "text/html; charset=utf-8");
  }
});

test("rejects binary and oversized responses", async () => {
  setCredentials();
  const binary = await fetchSiteContent("https://example.com", {
    fetch: async () => new Response(new Uint8Array([1, 2]), { headers: { "content-type": "image/png" } }),
  });
  const oversized = await fetchSiteContent("https://example.com", {
    maxResponseBytes: 5,
    fetch: async () => new Response("too large", { headers: { "content-type": "text/plain" } }),
  });

  assert.equal(binary.ok, false);
  assert.equal(oversized.ok, false);
  if (!binary.ok) assert.equal(binary.error.code, "non_text_response");
  if (!oversized.ok) assert.equal(oversized.error.code, "response_too_large");
});
