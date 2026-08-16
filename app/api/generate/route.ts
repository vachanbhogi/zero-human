import { NextRequest, NextResponse } from "next/server";
import { runSprint } from "@/lib/agents/pipeline";
import { getOrdersServer } from "@/lib/orders-factory";
import { SupabaseOrdersServer } from "@/lib/orders-supabase";

export const maxDuration = 300;

// Runs the agent pipeline for a paid order and returns the report URL.
//
// Authorization: possession of the order's Stripe Checkout session id — only
// the payer's success redirect carries it, and it is verified server-side
// against Stripe (payment_status + order binding) on every call. Ops can
// alternatively present the x-run-secret header (rehearsals, replays).
// Without one of the two, no token is minted and nothing runs — order ids
// are guessable (ord_<timestamp>_<5 chars>) and must never be sufficient.
//
// Idempotency: the paid -> processing claim is an atomic UPDATE, so a
// double-submit cannot run the pipeline twice; a finished order re-issues a
// fresh token over the old hash instead of re-running.

async function authorize(
  req: NextRequest,
  orderId: string,
  sessionId: string
): Promise<boolean> {
  const opsSecret = process.env.RUN_SHARED_SECRET;
  if (opsSecret && req.headers.get("x-run-secret") === opsSecret) return true;

  if (!sessionId) return false;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_")) return false;

  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  if (!res.ok) return false;
  const session = await res.json();
  const boundOrderId = session.client_reference_id || session.metadata?.order_id;
  return session.payment_status === "paid" && boundOrderId === orderId;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const fields = (body ?? {}) as { orderId?: unknown; sessionId?: unknown };
  const orderId = String(fields.orderId ?? "").trim();
  const sessionId = String(fields.sessionId ?? "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  if (!(await authorize(req, orderId, sessionId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ordersServer = getOrdersServer();
  if (!(ordersServer instanceof SupabaseOrdersServer)) {
    return NextResponse.json(
      { error: "Durable order storage is not configured" },
      { status: 503 }
    );
  }

  const order = await ordersServer.getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Already generated: re-issue the delivery token idempotently.
  if (order.status === "completed") {
    const reissued = await ordersServer.reissueReportToken(orderId);
    if (reissued) {
      return NextResponse.json({ reportUrl: `/report/${reissued.reportToken}`, cached: true });
    }
    return NextResponse.json({ error: "Report unavailable" }, { status: 500 });
  }

  if (order.status === "processing") {
    return NextResponse.json({ pending: true }, { status: 202 });
  }
  if (order.status !== "paid") {
    return NextResponse.json({ error: "Order is not paid" }, { status: 402 });
  }

  const claimed = await ordersServer.claimOrderForProcessing(orderId);
  if (!claimed) {
    // Lost the race to a concurrent request; report pending.
    return NextResponse.json({ pending: true }, { status: 202 });
  }

  try {
    const { sprintResult } = await runSprint(orderId, { ordersServer });
    const { reportToken } = await ordersServer.completeOrder(orderId, sprintResult);
    return NextResponse.json({ reportUrl: `/report/${reportToken}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await ordersServer.failOrder(orderId, message).catch(console.error);
    console.error(`generate failed for ${orderId}:`, message);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
