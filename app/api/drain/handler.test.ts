import assert from "node:assert/strict";
import test from "node:test";
import { createDrainHandler } from "./handler";
import {
  DRAIN_BATCH_SIZE,
  MAX_DISPATCH_ATTEMPTS,
  STALE_CLAIM_MS,
  type AuthenticatedRunRunner,
  type DurableDispatchStore,
} from "./types";

const CRON_SECRET = "test-cron-secret";
const DISPATCH_ID = "123e4567-e89b-42d3-a456-426614174000";

function createStore(jobs: readonly { id: string; attempts: number }[]) {
  const recovered: unknown[] = [];
  const listed: unknown[] = [];
  const store: DurableDispatchStore = {
    async recoverStaleClaims(input) {
      recovered.push(input);
    },
    async listQueuedDispatchJobs(input) {
      listed.push(input);
      return jobs;
    },
  };

  return { recovered, listed, store };
}

function createRequest(secret = CRON_SECRET) {
  return new Request("https://tack.example/api/drain", {
    method: "POST",
    headers: { authorization: secret },
  });
}

test("rejects an invalid cron secret before touching the durable store", async () => {
  const { recovered, listed, store } = createStore([]);
  const runner: AuthenticatedRunRunner = { run: async () => assert.fail("should not run") };
  const handler = createDrainHandler({
    cronSecret: CRON_SECRET,
    now: () => new Date("2026-08-15T12:00:00.000Z"),
    runner,
    store,
  });

  const response = await handler(createRequest("wrong-secret"));

  assert.equal(response.status, 401);
  assert.deepEqual(recovered, []);
  assert.deepEqual(listed, []);
});

test("recovers stale claims and forwards only valid eligible dispatch IDs", async () => {
  const now = new Date("2026-08-15T12:00:00.000Z");
  const { recovered, listed, store } = createStore([
    { id: DISPATCH_ID, attempts: 0 },
    { id: "not-a-dispatch-id", attempts: 0 },
    { id: "123e4567-e89b-42d3-a456-426614174001", attempts: MAX_DISPATCH_ATTEMPTS },
  ]);
  const calls: string[] = [];
  const runner: AuthenticatedRunRunner = {
    async run({ dispatchId }) {
      calls.push(dispatchId);
    },
  };
  const handler = createDrainHandler({ cronSecret: CRON_SECRET, now: () => now, runner, store });

  const response = await handler(createRequest());

  assert.equal(response.status, 502);
  assert.deepEqual(calls, [DISPATCH_ID]);
  assert.deepEqual(recovered, [
    { claimedBefore: new Date(now.getTime() - STALE_CLAIM_MS), maxAttempts: MAX_DISPATCH_ATTEMPTS },
  ]);
  assert.deepEqual(listed, [{ limit: DRAIN_BATCH_SIZE, maxAttempts: MAX_DISPATCH_ATTEMPTS }]);
  assert.deepEqual(await response.json(), { dispatched: 1, failed: 2 });
});

test("limits each invocation to ten jobs", async () => {
  const jobs = Array.from({ length: DRAIN_BATCH_SIZE + 1 }, (_, index) => ({
    id: `123e4567-e89b-42d3-a456-${String(index).padStart(12, "0")}`,
    attempts: 0,
  }));
  const { store } = createStore(jobs);
  const calls: string[] = [];
  const handler = createDrainHandler({
    cronSecret: CRON_SECRET,
    now: () => new Date(),
    store,
    runner: { async run({ dispatchId }) { calls.push(dispatchId); } },
  });

  const response = await handler(createRequest());

  assert.equal(response.status, 200);
  assert.equal(calls.length, DRAIN_BATCH_SIZE);
});
