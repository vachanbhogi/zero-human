import assert from "node:assert/strict";
import test from "node:test";
import { createAuthenticatedRunRunner } from "./run-runner";

const DISPATCH_ID = "123e4567-e89b-42d3-a456-426614174000";

test("posts only dispatchId to the authenticated run endpoint", async () => {
  let request: Request | undefined;
  const runner = createAuthenticatedRunRunner({
    endpoint: new URL("https://tack.example/api/run"),
    runSecret: "run-secret",
    fetchImplementation: async (input, init) => {
      request = new Request(input, init);
      return new Response(null, { status: 200 });
    },
  });

  await runner.run({ dispatchId: DISPATCH_ID });

  assert.ok(request);
  assert.equal(request.method, "POST");
  assert.equal(request.url, "https://tack.example/api/run");
  assert.equal(request.headers.get("x-run-secret"), "run-secret");
  assert.deepEqual(await request.json(), { dispatchId: DISPATCH_ID });
});

test("rejects a non-success response from the run endpoint", async () => {
  const runner = createAuthenticatedRunRunner({
    endpoint: new URL("https://tack.example/api/run"),
    runSecret: "run-secret",
    fetchImplementation: async () => new Response(null, { status: 503 }),
  });

  await assert.rejects(() => runner.run({ dispatchId: DISPATCH_ID }));
});
