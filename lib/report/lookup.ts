// Server-only stored-result lookup for /report/<reportToken> (CONTRACT.md
// sections 6-7). Every miss — malformed token, unknown hash, hash mismatch,
// or a non-durable store — returns null so the route can serve one identical
// 404 with no existence oracle.

import { getOrdersServer } from "@/lib/orders-factory";
import { SupabaseOrdersServer } from "@/lib/orders-supabase";
import {
  hashReportToken,
  matchesReportTokenHash,
  parseReportToken,
} from "@/lib/report/token";

export interface StoredReport {
  orderId: string;
  resultJson: unknown;
}

export async function getReportByToken(rawToken: string): Promise<StoredReport | null> {
  const token = parseReportToken(rawToken);
  if (!token) return null;

  const ordersServer = getOrdersServer();
  if (!(ordersServer instanceof SupabaseOrdersServer)) return null;

  const hash = hashReportToken(token);
  const record = await ordersServer.getOrderByReportTokenHash(hash);
  if (!record || record.resultJson == null) return null;

  // Constant-time confirmation against the STORED hash rather than trusting
  // DB equality alone.
  if (!matchesReportTokenHash(token, record.reportTokenHash)) return null;

  return { orderId: record.orderId, resultJson: record.resultJson };
}
