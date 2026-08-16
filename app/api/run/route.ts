import { NextRequest, NextResponse } from "next/server";
import { runSprint } from "@/lib/agents/pipeline";
import { getOrdersServer } from "@/lib/orders-factory";

const ordersServer = getOrdersServer();

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

  const dispatchId =
    typeof body === "object" && body !== null && "dispatchId" in body
      ? String((body as { dispatchId: unknown }).dispatchId ?? "").trim()
      : "";

  if (!dispatchId) {
    return NextResponse.json({ error: "dispatchId is required" }, { status: 400 });
  }

  // Per CONTRACT.md v2 section 4: the FIRST action is an atomic claim of the
  // dispatch job (queued -> claimed). No agent work happens before a
  // successful claim. A null claim means the job doesn't exist or wasn't
  // queued (already claimed/done/failed by an earlier delivery) — skip
  // rather than error, so a retried drain/cron trigger for the same
  // dispatchId is a safe no-op.
  const claim = await ordersServer.claimDispatch(dispatchId);
  if (!claim) {
    return NextResponse.json({ skipped: true }, { status: 200 });
  }

  const { orderId } = claim;

  try {
    const { sprintResult } = await runSprint(orderId, { ordersServer });
    await ordersServer.completeOrder(orderId, sprintResult);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await ordersServer.failOrder(orderId, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
