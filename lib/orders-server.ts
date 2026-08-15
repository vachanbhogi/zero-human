// Vachan-owned per CONTRACT.md section 3. Temporary stub to unblock pipeline
// development; replace with the Supabase service-role implementation.
// Paid-order persistence failures must fail closed.
//
// Updated for CONTRACT.md v2 sections 4-5: dispatch_jobs-based claiming
// (claimDispatch) is now the gate in front of /api/run, and completeOrder
// persists a validated SprintResult (JSON) rather than rendered HTML.

import { randomBytes } from "crypto";
import type { OrderResponse } from "@/lib/types";
import type { DispatchClaim, OrdersServer, SprintResult } from "@/lib/pipeline-types";

interface StoredReport {
  sprintResult: SprintResult;
  reportToken: string;
}

type DispatchStatus = "queued" | "claimed" | "done" | "failed";

interface DispatchJob {
  id: string;
  orderId: string;
  status: DispatchStatus;
  attempts: number;
  claimedAt: string | null;
  createdAt: string;
}

/**
 * In-memory implementation of OrdersServer. State does not survive a process
 * restart or span serverless invocations — this is a placeholder only, not a
 * substitute for the real persistence layer.
 */
export class InMemoryOrdersServer implements OrdersServer {
  private readonly orders = new Map<string, OrderResponse>();
  private readonly reports = new Map<string, StoredReport>();
  private readonly failures = new Map<string, string>();
  private readonly dispatchJobs = new Map<string, DispatchJob>();

  constructor(seed: OrderResponse[] = []) {
    for (const order of seed) {
      this.orders.set(order.orderId, { ...order });
    }
  }

  /** Dev/test-only helper for seeding orders. Not part of the OrdersServer contract. */
  seedOrder(order: OrderResponse): void {
    this.orders.set(order.orderId, { ...order });
  }

  /**
   * Dev/test-only helper for seeding a dispatch_jobs row. Not part of the
   * OrdersServer contract. Mirrors the real schema (CONTRACT.md v2 section
   * 4): id, order_id (unique), status, attempts, claimed_at, created_at.
   */
  seedDispatch(dispatchId: string, orderId: string, status: DispatchStatus = "queued"): void {
    this.dispatchJobs.set(dispatchId, {
      id: dispatchId,
      orderId,
      status,
      attempts: 0,
      claimedAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  async getOrder(orderId: string): Promise<OrderResponse | null> {
    const order = this.orders.get(orderId);
    return order ? { ...order } : null;
  }

  /**
   * Atomically claims an order for processing. Returns false (never throws)
   * when the order is missing or not in a claimable state, so callers can
   * treat repeated invocations for the same orderId as safe, idempotent
   * retries rather than errors. Superseded as the /api/run gate by
   * claimDispatch (CONTRACT.md v2 section 4); used internally by
   * claimDispatch below to keep order status in sync with dispatch state.
   */
  async claimOrderForProcessing(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) return false;
    if (order.status !== "paid") return false;
    order.status = "processing";
    return true;
  }

  /**
   * Atomically claims a dispatch job: mirrors
   * `UPDATE dispatch_jobs SET status='claimed', claimed_at=now(),
   * attempts=attempts+1 WHERE id=$1 AND status='queued' RETURNING *`
   * (CONTRACT.md v2 section 4). Returns null (never throws) when the job
   * doesn't exist or isn't `queued` — callers must treat null as "skip, do
   * no agent work" rather than an error. On a successful claim, also
   * advances the associated order's status via claimOrderForProcessing
   * (best-effort; a mismatch there doesn't block the claim, since the
   * dispatch job's own status is the source of truth for claimability).
   */
  async claimDispatch(dispatchId: string): Promise<DispatchClaim | null> {
    const job = this.dispatchJobs.get(dispatchId);
    if (!job) return null;
    if (job.status !== "queued") return null;

    job.status = "claimed";
    job.claimedAt = new Date().toISOString();
    job.attempts += 1;

    await this.claimOrderForProcessing(job.orderId);

    return { orderId: job.orderId };
  }

  private findDispatchJobByOrderId(orderId: string): DispatchJob | undefined {
    for (const job of this.dispatchJobs.values()) {
      if (job.orderId === orderId) return job;
    }
    return undefined;
  }

  async completeOrder(
    orderId: string,
    sprintResult: SprintResult
  ): Promise<{ reportToken: string }> {
    const order = this.orders.get(orderId);
    if (!order) {
      // Fail closed: never mint a token for an order we cannot persist against.
      throw new Error(`completeOrder: unknown orderId "${orderId}"`);
    }
    const reportToken = randomBytes(32).toString("base64url");
    this.reports.set(orderId, { sprintResult, reportToken });
    order.status = "completed";

    const job = this.findDispatchJobByOrderId(orderId);
    if (job) job.status = "done";

    return { reportToken };
  }

  async failOrder(orderId: string, reason: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = "failed";
    }
    this.failures.set(orderId, reason);

    const job = this.findDispatchJobByOrderId(orderId);
    if (job) job.status = "failed";
  }
}

// Process-wide singleton so app/api/run/route.ts and any callers share state
// within a single server instance. Replace with the Supabase-backed
// implementation before this pipeline handles real paid traffic.
export const ordersServer = new InMemoryOrdersServer();
