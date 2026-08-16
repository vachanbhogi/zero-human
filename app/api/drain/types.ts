export const DRAIN_BATCH_SIZE = 10;
export const MAX_DISPATCH_ATTEMPTS = 3;
export const STALE_CLAIM_MS = 10 * 60 * 1000;

export type DispatchJob = Readonly<{
  id: string;
  attempts: number;
}>;

export type RecoverStaleClaimsInput = Readonly<{
  claimedBefore: Date;
  maxAttempts: number;
}>;

export type ListQueuedDispatchJobsInput = Readonly<{
  limit: number;
  maxAttempts: number;
}>;

export interface DurableDispatchStore {
  recoverStaleClaims(input: RecoverStaleClaimsInput): Promise<void>;
  listQueuedDispatchJobs(
    input: ListQueuedDispatchJobsInput
  ): Promise<readonly DispatchJob[]>;
}

export interface AuthenticatedRunRunner {
  run(input: Readonly<{ dispatchId: string }>): Promise<void>;
}
