import type { OrderResponse } from "@/lib/types";

/** A citation for a fact pulled into the report — where it came from and when. */
export interface SourceRef {
  url: string;
  retrievedAt: string;
}

export interface CompetitorEntry {
  name: string;
  positioning: string;
  weakness: string;
  sources: SourceRef[];
  /**
   * True when this competitor was not backed by anything the Scout agent
   * actually retrieved — i.e. the Analyst inferred it from general knowledge
   * rather than from a scanned source. Inference entries must carry an empty
   * `sources` array.
   */
  inference?: boolean;
}

/** SprintResult.terac before a real Terac study has completed (the default). */
export interface TeracNotRun {
  status: "not_run";
}

/** SprintResult.terac once a real Terac study has completed and been scored. */
export interface TeracCompleted {
  status: "completed";
  studyId: string;
  aScore: number;
  bScore: number;
  metric: string;
}

/**
 * Discriminated union per CONTRACT.md v2 section 9: stays `not_run` unless a
 * real completed study exists, in which case studyId/scores/metric are all
 * required together. Never populate scores without status: "completed".
 */
export type TeracResult = TeracNotRun | TeracCompleted;

export interface SprintResult {
  orderId: string;
  company: string;
  generatedAt: string;
  execSummary: string;
  competitors: CompetitorEntry[];
  personas: { name: string; pain: string; trigger: string }[];
  outreach: { angle: string; subject?: string; body: string }[];
  nextMove: string;
  variantUsed: "A" | "B";
  terac: TeracResult;
  sources: SourceRef[];
}

/**
 * A single durable dispatch job backing an order's pipeline run, per
 * CONTRACT.md v2 section 4. The real table (`dispatch_jobs`) and its drain
 * process are Codex-owned; this shape describes only what OrdersServer.
 * claimDispatch needs to hand back.
 */
export interface DispatchClaim {
  orderId: string;
}

/**
 * Server-side interface over paid-order + dispatch persistence, per
 * CONTRACT.md v2 sections 3-5. The production implementation (Supabase,
 * service-role) is Vachan-owned; lib/orders-server.ts is a temporary
 * in-memory stand-in used to unblock pipeline development.
 */
export interface OrdersServer {
  getOrder(orderId: string): Promise<OrderResponse | null>;
  /**
   * Order-status-based claim (pending_payment/paid -> processing). Superseded
   * as the /api/run gate by claimDispatch below (CONTRACT.md v2 section 4),
   * but kept on the interface as it may still be used internally (e.g. by a
   * claimDispatch implementation, or by other order-status consumers).
   */
  claimOrderForProcessing(orderId: string): Promise<boolean>;
  /**
   * Atomically claims a dispatch job: `queued` -> `claimed`. Returns the
   * job's orderId on success, or null if the job doesn't exist or wasn't in
   * a claimable (`queued`) state — callers must treat null as "skip, don't
   * do any agent work" (CONTRACT.md v2 section 4).
   */
  claimDispatch(dispatchId: string): Promise<DispatchClaim | null>;
  /** Persists a validated SprintResult (JSON, never rendered HTML). */
  completeOrder(
    orderId: string,
    sprintResult: SprintResult
  ): Promise<{ reportToken: string }>;
  failOrder(orderId: string, reason: string): Promise<void>;
}
