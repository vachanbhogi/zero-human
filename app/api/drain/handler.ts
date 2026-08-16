import { timingSafeEqual } from "node:crypto";
import {
  DRAIN_BATCH_SIZE,
  MAX_DISPATCH_ATTEMPTS,
  STALE_CLAIM_MS,
  type AuthenticatedRunRunner,
  type DurableDispatchStore,
} from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DrainHandlerDependencies = Readonly<{
  cronSecret: string | undefined;
  now: () => Date;
  runner: AuthenticatedRunRunner;
  store: DurableDispatchStore;
}>;

function hasValidCronSecret(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function isDispatchId(value: string) {
  return UUID_PATTERN.test(value);
}

export function createDrainHandler(dependencies: DrainHandlerDependencies) {
  return async function drain(request: Request): Promise<Response> {
    if (!hasValidCronSecret(request.headers.get("authorization"), dependencies.cronSecret)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = dependencies.now();
    await dependencies.store.recoverStaleClaims({
      claimedBefore: new Date(now.getTime() - STALE_CLAIM_MS),
      maxAttempts: MAX_DISPATCH_ATTEMPTS,
    });

    const jobs = await dependencies.store.listQueuedDispatchJobs({
      limit: DRAIN_BATCH_SIZE,
      maxAttempts: MAX_DISPATCH_ATTEMPTS,
    });

    let dispatched = 0;
    let failed = 0;

    for (const job of jobs.slice(0, DRAIN_BATCH_SIZE)) {
      if (!isDispatchId(job.id) || job.attempts >= MAX_DISPATCH_ATTEMPTS) {
        failed += 1;
        continue;
      }

      try {
        await dependencies.runner.run({ dispatchId: job.id });
        dispatched += 1;
      } catch {
        failed += 1;
      }
    }

    return Response.json(
      { dispatched, failed },
      { status: failed === 0 ? 200 : 502 }
    );
  };
}
