// Vachan-owned per CONTRACT.md section 3. Temporary stub to unblock pipeline
// development; replace with the Supabase service-role implementation.
// Paid-order persistence failures must fail closed.

import { randomBytes } from "crypto";
import type { OrderResponse } from "@/lib/types";
import type { OrdersServer } from "@/lib/pipeline-types";

interface StoredReport {
  reportHtml: string;
  reportToken: string;
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

  constructor(seed: OrderResponse[] = []) {
    for (const order of seed) {
      this.orders.set(order.orderId, { ...order });
    }
  }

  /** Dev/test-only helper for seeding orders. Not part of the OrdersServer contract. */
  seedOrder(order: OrderResponse): void {
    this.orders.set(order.orderId, { ...order });
  }

  async getOrder(orderId: string): Promise<OrderResponse | null> {
    const order = this.orders.get(orderId);
    return order ? { ...order } : null;
  }

  /**
   * Atomically claims an order for processing. Returns false (never throws)
   * when the order is missing or not in a claimable state, so callers can
   * treat repeated /api/run invocations for the same orderId as safe,
   * idempotent retries rather than errors.
   */
  async claimOrderForProcessing(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) return false;
    if (order.status !== "paid") return false;
    order.status = "processing";
    return true;
  }

  async completeOrder(
    orderId: string,
    reportHtml: string
  ): Promise<{ reportToken: string }> {
    const order = this.orders.get(orderId);
    if (!order) {
      // Fail closed: never mint a token for an order we cannot persist against.
      throw new Error(`completeOrder: unknown orderId "${orderId}"`);
    }
    const reportToken = randomBytes(32).toString("base64url");
    this.reports.set(orderId, { reportHtml, reportToken });
    order.status = "completed";
    return { reportToken };
  }

  async failOrder(orderId: string, reason: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = "failed";
    }
    this.failures.set(orderId, reason);
  }
}

// Process-wide singleton so app/api/run/route.ts and any callers share state
// within a single server instance. Replace with the Supabase-backed
// implementation before this pipeline handles real paid traffic.
export const ordersServer = new InMemoryOrdersServer();
