// Claude-owned. Supabase (service-role) implementation of the OrdersServer
// interface (lib/pipeline-types.ts), backing the durable persistence layer
// described in CONTRACT.md v2 sections 3-6. Server-side only: constructs a
// service-role Supabase client from SUPABASE_SECRET_KEY, which must never
// reach the browser bundle.
//
// Fail-closed: every Supabase error is thrown, never swallowed into an
// in-memory fallback. A paid order's state must live in Postgres or the
// caller must know persistence failed — silent fallback was launch blocker
// #2 in CONTRACT.md v2 section 8.1.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { OrderResponse } from "@/lib/types";
import type { DispatchClaim, OrdersServer, SprintResult } from "@/lib/pipeline-types";
import { hashToken, mintToken } from "@/lib/orders-tokens";

/** Result of the mark_order_paid RPC (supabase/schema-v2.sql section 4). */
export type MarkOrderPaidResult = "ok" | "duplicate" | "invalid_state";

/** Shape returned to the report page for a validated report_token. */
export interface ReportRecord {
  orderId: string;
  status: OrderResponse["status"];
  url: string;
  niche: string;
  company?: string;
  audience?: string;
  resultJson: SprintResult | null;
}

interface OrdersRow {
  id: string;
  status: OrderResponse["status"];
  created_at: string;
  url: string;
  niche: string;
  email: string;
  company: string | null;
  audience: string | null;
  competitors: string[] | null;
  focus: string | null;
  stage: string | null;
  business_id?: string | null;
  product_id?: string | null;
  user_id?: string | null;
}

function rowToOrder(row: OrdersRow): OrderResponse {
  return {
    orderId: row.id,
    status: row.status,
    createdAt: row.created_at,
    url: row.url,
    niche: row.niche,
    email: row.email,
    company: row.company ?? undefined,
    audience: row.audience ?? undefined,
    competitors: row.competitors ?? undefined,
    focus: row.focus ?? undefined,
    stage: row.stage ?? undefined,
    businessId: row.business_id ?? undefined,
    productId: row.product_id ?? undefined,
    ownerId: row.user_id ?? undefined,
  };
}

export class SupabaseOrdersServer implements OrdersServer {
  private readonly client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseSecretKey: string) {
    if (typeof window !== "undefined") {
      throw new Error(
        "SupabaseOrdersServer must never be constructed in a browser context " +
          "(it holds the service-role key)."
      );
    }
    if (!supabaseUrl || !supabaseSecretKey) {
      throw new Error(
        "SupabaseOrdersServer requires both a Supabase URL and a service-role secret key."
      );
    }
    this.client = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async getOrder(orderId: string): Promise<OrderResponse | null> {
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(`getOrder(${orderId}): ${error.message}`);
    }
    return data ? rowToOrder(data as OrdersRow) : null;
  }

  /**
   * Order-status-based claim (pending_payment/paid -> processing), per the
   * OrdersServer interface doc. Returns false — not an error — when no row
   * matched (order missing or not in a claimable state); a Supabase-level
   * failure still throws (fail closed).
   */
  async claimOrderForProcessing(orderId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("orders")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .in("status", ["pending_payment", "paid"])
      .select("id");

    if (error) {
      throw new Error(`claimOrderForProcessing(${orderId}): ${error.message}`);
    }
    return (data?.length ?? 0) > 0;
  }

  /** Wraps the claim_dispatch RPC (supabase/schema-v2.sql section 5). */
  async claimDispatch(dispatchId: string): Promise<DispatchClaim | null> {
    const { data, error } = await this.client.rpc("claim_dispatch", {
      p_dispatch_id: dispatchId,
    });

    if (error) {
      throw new Error(`claimDispatch(${dispatchId}): ${error.message}`);
    }

    const row = Array.isArray(data) ? (data[0] as { order_id?: string } | undefined) : undefined;
    if (!row?.order_id) return null;
    return { orderId: row.order_id };
  }

  /**
   * Persists the validated SprintResult, mints a report_token, stores only
   * its SHA-256 hash, marks the order completed and its dispatch job done.
   * Returns the raw report_token exactly once — it is never retrievable
   * again after this call returns.
   */
  async completeOrder(
    orderId: string,
    sprintResult: SprintResult
  ): Promise<{ reportToken: string }> {
    const reportToken = mintToken();
    const reportTokenHash = hashToken(reportToken);

    const { data, error } = await this.client
      .from("orders")
      .update({
        status: "completed",
        result_json: sprintResult,
        report_token_hash: reportTokenHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id");

    if (error) {
      throw new Error(`completeOrder(${orderId}): failed to persist order: ${error.message}`);
    }
    if (!data || data.length === 0) {
      // Fail closed: never hand back a token for an order we didn't persist against.
      throw new Error(`completeOrder(${orderId}): unknown orderId`);
    }

    const { error: dispatchError } = await this.client
      .from("dispatch_jobs")
      .update({ status: "done" })
      .eq("order_id", orderId);

    if (dispatchError) {
      throw new Error(
        `completeOrder(${orderId}): order marked completed but dispatch update failed: ${dispatchError.message}`
      );
    }

    return { reportToken };
  }

  async failOrder(orderId: string, reason: string): Promise<void> {
    const { error } = await this.client
      .from("orders")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      throw new Error(`failOrder(${orderId}): ${error.message}`);
    }

    const { error: dispatchError } = await this.client
      .from("dispatch_jobs")
      .update({ status: "failed" })
      .eq("order_id", orderId);

    if (dispatchError) {
      throw new Error(`failOrder(${orderId}): dispatch update failed: ${dispatchError.message}`);
    }

    // schema-v2.sql has no failure-reason column yet; surface it via logs
    // until one exists (TODO, see docs/APPLY-SCHEMA.md notes).
    console.error(`[orders-supabase] order ${orderId} failed: ${reason}`);
  }

  /**
   * Wraps the mark_order_paid RPC (supabase/schema-v2.sql section 4) for
   * the Stripe webhook (Codex-owned, CONTRACT.md v2 section 2-3) to call.
   */
  async markOrderPaid(
    eventId: string,
    eventType: string,
    livemode: boolean,
    payload: unknown,
    orderId: string
  ): Promise<MarkOrderPaidResult> {
    const { data, error } = await this.client.rpc("mark_order_paid", {
      p_event_id: eventId,
      p_event_type: eventType,
      p_livemode: livemode,
      p_payload: payload,
      p_order_id: orderId,
    });

    if (error) {
      throw new Error(`markOrderPaid(${orderId}): ${error.message}`);
    }
    if (data !== "ok" && data !== "duplicate" && data !== "invalid_state") {
      throw new Error(`markOrderPaid(${orderId}): unexpected RPC result ${JSON.stringify(data)}`);
    }
    return data;
  }

  /**
   * Looks up an order by the SHA-256 hash of its report_token, for the
   * report page (CONTRACT.md v2 sections 6-7). Returns null on no match —
   * callers must render the same generic 404 for "no match" and "wrong
   * token" (no existence oracle).
   */
  async getOrderByReportTokenHash(hash: string): Promise<ReportRecord | null> {
    const { data, error } = await this.client
      .from("orders")
      .select("id, status, url, niche, company, audience, result_json")
      .eq("report_token_hash", hash)
      .maybeSingle();

    if (error) {
      throw new Error(`getOrderByReportTokenHash: ${error.message}`);
    }
    if (!data) return null;

    return {
      orderId: data.id,
      status: data.status,
      url: data.url,
      niche: data.niche,
      company: data.company ?? undefined,
      audience: data.audience ?? undefined,
      resultJson: (data.result_json as SprintResult | null) ?? null,
    };
  }
}
