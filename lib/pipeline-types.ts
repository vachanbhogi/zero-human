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
  terac?: {
    aScore: number;
    bScore: number;
    metric: string;
    studyId: string;
  };
  sources: SourceRef[];
}

/**
 * Server-side interface over paid-order persistence. Owned by Vachan per
 * CONTRACT.md section 3 — see lib/orders-server.ts for the current
 * (temporary) implementation.
 */
export interface OrdersServer {
  getOrder(orderId: string): Promise<OrderResponse | null>;
  claimOrderForProcessing(orderId: string): Promise<boolean>;
  completeOrder(
    orderId: string,
    reportHtml: string
  ): Promise<{ reportToken: string }>;
  failOrder(orderId: string, reason: string): Promise<void>;
}
