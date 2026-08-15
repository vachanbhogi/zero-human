import { NextRequest, NextResponse } from "next/server";
import { runSprint } from "@/lib/agents/pipeline";
import { ordersServer } from "@/lib/orders-server";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const sharedSecret = process.env.RUN_SHARED_SECRET;
  if (!sharedSecret) {
    return NextResponse.json(
      { error: "RUN_SHARED_SECRET is not configured" },
      { status: 500 }
    );
  }

  const provided = req.headers.get("x-run-secret");
  if (provided !== sharedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderId =
    typeof body === "object" && body !== null && "orderId" in body
      ? String((body as { orderId: unknown }).orderId ?? "").trim()
      : "";

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  // Idempotent, retry-safe: if this order is already claimed (processing,
  // completed, or otherwise not in a claimable "paid" state), skip rather
  // than error, so a retried trigger for the same orderId is a safe no-op.
  const claimed = await ordersServer.claimOrderForProcessing(orderId);
  if (!claimed) {
    return NextResponse.json({ skipped: true }, { status: 200 });
  }

  try {
    const { reportHtml } = await runSprint(orderId, { ordersServer });
    await ordersServer.completeOrder(orderId, reportHtml);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await ordersServer.failOrder(orderId, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
